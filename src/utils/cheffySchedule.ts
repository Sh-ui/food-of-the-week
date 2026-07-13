// cheffySchedule.ts -- pure "week schedule" builder for Cheffy's local notifications.
// Full design contract: ../../CHEFFY-SYSTEM.md (see the notifications feature under
// `cheffyNotifications.ts` in the architecture table).
//
// Combines three sources into one flat, sorted list of notifications to schedule:
// cook times (parsed from the calendar island's ICS strings), mom's daily lunches
// (from lunch-week.json), and a self-perpetuating "come back and sync next week"
// reminder appended after everything else. Kept UI-independent so it can be
// unit-tested on its own: no DOM, no browser APIs, no Node APIs, no relative
// imports of JSON (see cheffyDialogue.ts / cheffyState.ts precedent). Callers
// (the future service-worker adapter) pass data in -- this module never imports
// the JSON itself. Every exported function is total: bad input yields an empty
// array or null, never a throw.

export type NotificationKind = 'cook' | 'lunch' | 'sync';

export type ScheduledNotification = {
  id: string; // stable + unique: `${kind}-${whenMs}-${slugified label}`
  whenMs: number; // epoch ms
  title: string;
  body: string;
  url: string; // absolute-path URL the notification click should open
  tag: string; // same as id (dedupe tag for showNotification)
  kind: NotificationKind;
};

// Subset of a src/data/lunch-week.json "days" entry.
export type LunchDay = { date: string; dow: string; name: string };

export type SyncReminderConfig = { dow: string; time: string }; // e.g. { dow: 'Sunday', time: '09:00' }

export type NotificationConfig = {
  lunchTime: string; // 'HH:MM' 24h local, default '11:00'
  syncReminder: SyncReminderConfig; // default { dow: 'Sunday', time: '09:00' }
};

export const DEFAULT_NOTIFICATION_CONFIG: NotificationConfig = {
  lunchTime: '11:00',
  syncReminder: { dow: 'Sunday', time: '09:00' },
};

const DOW_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/** lowercase, runs of non-alphanumerics collapsed to a single '-', trimmed at both ends. */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '');
}

/** Parses 'H:MM' / 'HH:MM' into { h, m } if in-range, else null. Total, never throws. */
function parseTimeHHMM(time: unknown): { h: number; m: number } | null {
  if (typeof time !== 'string') return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return { h, m };
}

/** English day name (any case) -> 0-6 (Sunday-Saturday) index, or -1 if not recognized. */
function dowIndex(name: unknown): number {
  if (typeof name !== 'string') return -1;
  return DOW_NAMES.indexOf(name.trim().toLowerCase());
}

/** Canonical Title-case spelling for a recognized dow index. */
function dowLabel(index: number): string {
  const name = DOW_NAMES[index] ?? DOW_NAMES[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Fail-soft merge of a partial/unknown-shaped config object over the defaults.
 * Invalid time strings (not /^\d{1,2}:\d{2}$/ or out of range) and invalid dow
 * names fall back to the matching default field. Never throws.
 */
export function resolveNotificationConfig(raw: unknown): NotificationConfig {
  const defaults = DEFAULT_NOTIFICATION_CONFIG;
  if (!raw || typeof raw !== 'object') {
    return { lunchTime: defaults.lunchTime, syncReminder: { ...defaults.syncReminder } };
  }

  const r = raw as Record<string, unknown>;
  const lunchTime = parseTimeHHMM(r.lunchTime) ? (r.lunchTime as string).trim() : defaults.lunchTime;

  const rawSync = r.syncReminder && typeof r.syncReminder === 'object' ? (r.syncReminder as Record<string, unknown>) : {};
  const dowIdx = dowIndex(rawSync.dow);
  const dow = dowIdx >= 0 ? dowLabel(dowIdx) : defaults.syncReminder.dow;
  const time = parseTimeHHMM(rawSync.time) ? (rawSync.time as string).trim() : defaults.syncReminder.time;

  return { lunchTime, syncReminder: { dow, time } };
}

/** Every DTSTART:YYYYMMDDTHHMMSSZ in an ICS blob -> epoch ms (UTC). Total, never throws. */
export function parseDtstarts(ics: string): number[] {
  if (typeof ics !== 'string') return [];
  const re = /DTSTART:(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/g;
  const out: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(ics))) {
    out.push(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]));
  }
  return out;
}

/** Cook-time notifications from the calendar island meals. Total, never throws. */
export function buildCookNotifications(
  meals: Array<{ label: string; ics: string }>,
  url: string
): ScheduledNotification[] {
  if (!Array.isArray(meals)) return [];
  const safeUrl = typeof url === 'string' ? url : '';
  const out: ScheduledNotification[] = [];

  for (const meal of meals) {
    if (!meal || typeof meal !== 'object') continue;
    const label = typeof meal.label === 'string' ? meal.label : '';
    const whens = parseDtstarts(meal.ics);
    for (const whenMs of whens) {
      const id = `cook-${whenMs}-${slugify(label)}`;
      out.push({
        id,
        whenMs,
        title: 'Time to cook!',
        body: label ? `${label} -- it's cooking time.` : "It's cooking time.",
        url: safeUrl,
        tag: id,
        kind: 'cook',
      });
    }
  }
  return out;
}

/**
 * Daily lunch reminders. Each LunchDay.date is 'YYYY-MM-DD'; constructed as a
 * LOCAL time via new Date(y, m-1, d, hh, mm) -- never new Date('YYYY-MM-DD'),
 * which is UTC midnight and would give the wrong dow/local time. Total, never
 * throws.
 */
export function buildLunchNotifications(days: LunchDay[], lunchTime: string, url: string): ScheduledNotification[] {
  if (!Array.isArray(days)) return [];
  const safeUrl = typeof url === 'string' ? url : '';
  const time = parseTimeHHMM(lunchTime) ?? (parseTimeHHMM(DEFAULT_NOTIFICATION_CONFIG.lunchTime) as { h: number; m: number });

  const out: ScheduledNotification[] = [];
  for (const day of days) {
    if (!day || typeof day !== 'object') continue;
    if (typeof day.date !== 'string' || typeof day.name !== 'string') continue;

    const parts = day.date.split('-');
    if (parts.length !== 3) continue;
    const [y, mo, d] = parts.map(Number);
    if (!Number.isInteger(y) || !Number.isInteger(mo) || !Number.isInteger(d)) continue;

    const when = new Date(y, mo - 1, d, time.h, time.m, 0, 0);
    const whenMs = when.getTime();
    if (!Number.isFinite(whenMs)) continue;

    const id = `lunch-${whenMs}-${slugify(day.name)}`;
    out.push({
      id,
      whenMs,
      title: 'Lunch time!',
      body: `Today's lunch: ${day.name}`,
      url: safeUrl,
      tag: id,
      kind: 'lunch',
    });
  }
  return out;
}

/**
 * The self-perpetuating sync reminder: fires on the FIRST occurrence of
 * config.syncReminder.dow at its time that is strictly AFTER `afterMs` (pass
 * the max whenMs of the rest of the schedule, or now if the schedule is
 * empty). Returns null only if config is invalid beyond repair (shouldn't
 * happen after resolveNotificationConfig). Never throws.
 */
export function buildSyncReminder(afterMs: number, config: NotificationConfig, url: string): ScheduledNotification | null {
  if (!Number.isFinite(afterMs) || !config || typeof config !== 'object') return null;
  const dowIdx = dowIndex(config.syncReminder?.dow);
  const time = parseTimeHHMM(config.syncReminder?.time);
  if (dowIdx < 0 || !time) return null;

  const safeUrl = typeof url === 'string' ? url : '';
  const base = new Date(afterMs);

  let candidate = new Date(base.getFullYear(), base.getMonth(), base.getDate(), time.h, time.m, 0, 0);
  while (candidate.getDay() !== dowIdx) {
    candidate = new Date(candidate.getFullYear(), candidate.getMonth(), candidate.getDate() + 1, time.h, time.m, 0, 0);
  }
  if (candidate.getTime() <= afterMs) {
    candidate = new Date(candidate.getFullYear(), candidate.getMonth(), candidate.getDate() + 7, time.h, time.m, 0, 0);
  }

  const whenMs = candidate.getTime();
  const title = 'New week is up!';
  const id = `sync-${whenMs}-${slugify(title)}`;
  return {
    id,
    whenMs,
    title,
    body: "Open Cheffy and tap 'sync reminders' to load this week's pings.",
    url: safeUrl,
    tag: id,
    kind: 'sync',
  };
}

/**
 * Combine everything: cook + lunch + a sync reminder appended after the
 * latest entry. Filters out entries with whenMs <= now, sorts ascending by
 * whenMs, and dedupes by id (first wins). Total, never throws.
 */
export function buildWeekSchedule(input: {
  meals: Array<{ label: string; ics: string }>;
  lunchDays: LunchDay[];
  config: NotificationConfig;
  urls: { week: string; lunch: string; home: string };
  now: number;
}): ScheduledNotification[] {
  const safe = input && typeof input === 'object' ? input : ({} as typeof input);
  const config = safe.config && typeof safe.config === 'object' ? safe.config : DEFAULT_NOTIFICATION_CONFIG;
  const urls = safe.urls && typeof safe.urls === 'object' ? safe.urls : ({ week: '', lunch: '', home: '' } as typeof safe.urls);
  const now = Number.isFinite(safe.now) ? safe.now : Date.now();

  const cook = buildCookNotifications(Array.isArray(safe.meals) ? safe.meals : [], urls?.week ?? '');
  const lunch = buildLunchNotifications(Array.isArray(safe.lunchDays) ? safe.lunchDays : [], config.lunchTime, urls?.lunch ?? '');
  const rest = [...cook, ...lunch];

  // Anchor strictly after BOTH the latest scheduled entry and now -- syncing late
  // in the week (every event already past) must still yield a future reminder.
  const afterMs = rest.length ? Math.max(now, ...rest.map((n) => n.whenMs)) : now;
  const sync = buildSyncReminder(afterMs, config, urls?.home ?? '');

  const all = sync ? [...rest, sync] : rest;
  const upcoming = all.filter((n) => n.whenMs > now);
  upcoming.sort((a, b) => a.whenMs - b.whenMs);

  const seen = new Set<string>();
  const out: ScheduledNotification[] = [];
  for (const n of upcoming) {
    if (seen.has(n.id)) continue;
    seen.add(n.id);
    out.push(n);
  }
  return out;
}
