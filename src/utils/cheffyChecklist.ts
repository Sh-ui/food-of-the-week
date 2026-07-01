// cheffyChecklist.ts -- client-side registration for the checklist export/import
// actions (export-checklist, import-checklist).
// Full design contract: ../../CHEFFY-SYSTEM.md.
//
// BROWSER-ONLY DOM code. Reads/writes GroceryList.astro's EXACT localStorage
// contract (single source of truth -- no parallel key, no richer value shape).
// Deliberately imports NOTHING from cheffyCalendarActions.ts (would re-run its
// register() side effects) or cheffyCalendar.ts (uses Buffer, unsafe client-side).
//
// See notes/cheffy_p6_checklist_plan.md for the full contract.

import { slugifyWeekTitle } from '../utils/cheffyState';

// Module-top, order-safe registration helper -- works whether CheffyPanel's script
// (which defines window.registerCheffyAction) has run yet or not.
const w = window as any;
const register =
  w.registerCheffyAction ||
  ((name: string, fn: (ctx: any) => void) => {
    w.cheffyActions = w.cheffyActions || {};
    w.cheffyActions[name] = fn;
  });

const NO_LIST_MESSAGE = 'No grocery list on this page to export.';

// --- Storage contract (byte-identical to GroceryList.astro) ---------------

function storageKey(): string {
  const h1 = document.querySelector('h1')?.textContent || 'current-week';
  return `grocery-list-${slugifyWeekTitle(h1)}`;
}

function weekId(): string {
  return slugifyWeekTitle(document.querySelector('h1')?.textContent || 'current-week');
}

function loadChecked(): Set<string> {
  const raw = localStorage.getItem(storageKey());
  try {
    return raw ? new Set<string>(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveChecked(set: Set<string>): void {
  localStorage.setItem(storageKey(), JSON.stringify([...set]));
}

function itemKeyOf(cb: HTMLInputElement): string {
  return `${cb.dataset.category || ''}::${cb.dataset.index || ''}::${cb.dataset.item || ''}`;
}

function checkboxes(): HTMLInputElement[] {
  return Array.from(document.querySelectorAll<HTMLInputElement>('.grocery-checkbox'));
}

// Local copy of the download idiom (do NOT cross-import cheffyCalendarActions.ts --
// that re-runs its register() side effects). Generalized over mime type.
function download(fileName: string, text: string, mime: string): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0); // revoke next tick so the download starts
}

// Category-grouped snapshot from the DOM (insertion order = document order).
function snapshot(): {
  checked: Set<string>;
  categories: { name: string; items: { text: string; checked: boolean }[] }[];
} {
  const checked = loadChecked();
  const byCat = new Map<string, { text: string; checked: boolean }[]>();
  for (const cb of checkboxes()) {
    const cat = cb.dataset.category || '';
    const key = itemKeyOf(cb);
    if (!byCat.has(cat)) byCat.set(cat, []);
    byCat.get(cat)!.push({ text: cb.dataset.item || '', checked: checked.has(key) });
  }
  return { checked, categories: [...byCat].map(([name, items]) => ({ name, items })) };
}

function setText(ctx: any, msg: string): void {
  const el = ctx.panel?.querySelector('.cheffy-text');
  if (el) el.textContent = msg;
}

// --- Export payload builders ------------------------------------------------

function toJson(): string {
  const { checked, categories } = snapshot();
  return JSON.stringify(
    { weekId: weekId(), storageKey: storageKey(), checked: [...checked], categories },
    null,
    2
  );
}

function toMarkdown(): string {
  const { categories } = snapshot();
  const title = document.querySelector('h1')?.textContent || 'Current Week';
  let out = `# Grocery Checklist -- ${title}\n`;
  for (const cat of categories) {
    out += `\n## ${cat.name}\n`;
    for (const it of cat.items) out += `- [${it.checked ? 'x' : ' '}] ${it.text}\n`;
  }
  return out;
}

// --- Import parsing ----------------------------------------------------------

// Returns the imported checked-key Set, or null if unparseable.
// JSON path is authoritative (round-trips toJson()). Markdown path is best-effort:
// match "- [x] text" lines against the CURRENT DOM's item texts to recover
// category::index::text keys.
function parseImport(text: string): Set<string> | null {
  const t = text.trim();
  // 1) JSON
  try {
    const obj = JSON.parse(t);
    if (obj && Array.isArray(obj.checked)) return new Set<string>(obj.checked.map(String));
  } catch {
    /* fall through to markdown */
  }
  // 2) Markdown "- [x] item" (checked only). Recover keys by matching item text to DOM.
  const textToKeys = new Map<string, string[]>();
  for (const cb of checkboxes()) {
    const txt = (cb.dataset.item || '').trim();
    if (!textToKeys.has(txt)) textToKeys.set(txt, []);
    textToKeys.get(txt)!.push(itemKeyOf(cb));
  }
  const out = new Set<string>();
  let matchedAny = false;
  for (const line of t.split(/\r?\n/)) {
    const m = /^\s*-\s*\[[xX]\]\s+(.*\S)\s*$/.exec(line); // checked lines only
    if (!m) continue;
    matchedAny = true;
    for (const k of textToKeys.get(m[1].trim()) || []) out.add(k);
  }
  return matchedAny ? out : null;
}

// --- DOM reflection (no GroceryList.astro edit, no reload) -------------------

// Mirror GroceryList.initializeCheckboxes() effects directly, from the outside.
// Programmatic .checked assignment does NOT fire the change event, so GroceryList's
// own change-listener does NOT double-write. We already wrote localStorage ourselves.
function reflect(finalSet: Set<string>): void {
  for (const cb of checkboxes()) {
    const on = finalSet.has(itemKeyOf(cb));
    cb.checked = on;
    const li = cb.closest('.grocery-item');
    if (li) li.classList.toggle('locally-checked', on);
  }
}

// --- export-checklist handler -------------------------------------------------

register('export-checklist', (ctx: any) => {
  try {
    const nodeEl = ctx.panel?.querySelector('.cheffy-node');
    if (!nodeEl) return;

    if (checkboxes().length === 0) {
      setText(ctx, NO_LIST_MESSAGE);
      return;
    }

    // Idempotent append: remove any prior container we injected.
    nodeEl.querySelector('.cheffy-checklist-export')?.remove();

    const container = document.createElement('ul');
    container.className = 'cheffy-checklist-export';

    const jsonLi = document.createElement('li');
    const jsonBtn = document.createElement('button');
    jsonBtn.type = 'button';
    jsonBtn.className = 'cheffy-meal-export';
    jsonBtn.textContent = 'Download JSON';
    jsonBtn.addEventListener('click', () => {
      try {
        download(`grocery-checklist-${weekId()}.json`, toJson(), 'application/json;charset=utf-8');
      } catch {
        setText(ctx, "Sorry, I couldn't export that just now.");
      }
    });
    jsonLi.appendChild(jsonBtn);
    container.appendChild(jsonLi);

    const mdLi = document.createElement('li');
    const mdBtn = document.createElement('button');
    mdBtn.type = 'button';
    mdBtn.className = 'cheffy-meal-export';
    mdBtn.textContent = 'Download Markdown';
    mdBtn.addEventListener('click', () => {
      try {
        download(`grocery-checklist-${weekId()}.md`, toMarkdown(), 'text/markdown;charset=utf-8');
      } catch {
        setText(ctx, "Sorry, I couldn't export that just now.");
      }
    });
    mdLi.appendChild(mdBtn);
    container.appendChild(mdLi);

    nodeEl.appendChild(container);
  } catch {
    setText(ctx, "Sorry, I couldn't export that just now.");
  }
});

// --- import-checklist handler -------------------------------------------------

register('import-checklist', (ctx: any) => {
  try {
    const nodeEl = ctx.panel?.querySelector('.cheffy-node');
    if (!nodeEl) return;

    // Idempotent append: remove any prior container we injected.
    nodeEl.querySelector('.cheffy-checklist-import')?.remove();

    const container = document.createElement('div');
    container.className = 'cheffy-checklist-import';

    const textarea = document.createElement('textarea');
    textarea.className = 'cheffy-import';
    textarea.placeholder = 'Paste exported JSON or Markdown';
    container.appendChild(textarea);

    const btnRow = document.createElement('ul');

    const applyImport = (mode: 'merge' | 'overwrite') => {
      try {
        const imported = parseImport(textarea.value);
        if (!imported) {
          setText(ctx, "I couldn't read that -- paste an exported JSON or Markdown checklist.");
          return;
        }
        const finalSet =
          mode === 'merge' ? new Set([...loadChecked(), ...imported]) : new Set(imported);
        saveChecked(finalSet);
        if (checkboxes().length > 0) reflect(finalSet);
        setText(
          ctx,
          mode === 'merge'
            ? `Merged -- ${finalSet.size} items now checked.`
            : `Replaced -- ${finalSet.size} items now checked.`
        );
      } catch {
        setText(ctx, "Sorry, I couldn't import that just now.");
      }
    };

    const mergeLi = document.createElement('li');
    const mergeBtn = document.createElement('button');
    mergeBtn.type = 'button';
    mergeBtn.className = 'cheffy-meal-export';
    mergeBtn.textContent = 'Merge';
    mergeBtn.addEventListener('click', () => applyImport('merge'));
    mergeLi.appendChild(mergeBtn);
    btnRow.appendChild(mergeLi);

    const overwriteLi = document.createElement('li');
    const overwriteBtn = document.createElement('button');
    overwriteBtn.type = 'button';
    overwriteBtn.className = 'cheffy-meal-export';
    overwriteBtn.textContent = 'Overwrite';
    overwriteBtn.addEventListener('click', () => applyImport('overwrite'));
    overwriteLi.appendChild(overwriteBtn);
    btnRow.appendChild(overwriteLi);

    container.appendChild(btnRow);
    nodeEl.appendChild(container);
  } catch {
    setText(ctx, "Sorry, I couldn't set up the import just now.");
  }
});
