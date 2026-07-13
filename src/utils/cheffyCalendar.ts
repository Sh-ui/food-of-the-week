// cheffyCalendar.ts -- time extraction + calendar export for Cheffy.
// Full design contract: ../../CHEFFY-SYSTEM.md > Feature: Calendar event sync.
//
// Kept UI-independent so it can be unit-tested on its own. Pure, dependency-free
// (beyond the existing `marked` runtime dep) -- no DOM/browser APIs, no Astro,
// no relative imports (see build blueprint contract decision #2).

import { marked } from 'marked';

/** A single cooking/prep moment extracted from the week's Markdown. */
export interface CookingEvent {
  /** Meal or task title, e.g. "Miso Salmon -- sheet pan in". */
  title: string;
  /** Event start. */
  start: Date;
  /** Optional duration in minutes (from "30 minutes" etc.). */
  durationMinutes?: number;
  /** Source meal slug, for per-recipe export and linking back. */
  mealSlug?: string;
}

// ============================================================================
// Small local helpers (no relative imports -- see build blueprint #2)
// ============================================================================

/** Generate a URL-safe slug from text. Local copy of weekParser's slugify. */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Format a Date to ICS/Google UTC form: YYYYMMDDTHHMMSSZ. Single source of truth. */
function toIcsUtc(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}` +
    `T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}Z`
  );
}

/** Escape text for an ICS content value. Order matters: backslash first. */
function escapeIcsText(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Fold a content line to <=75 octets per RFC 5545, CRLF + leading-space continuation. */
function foldLine(line: string): string {
  if (Buffer.byteLength(line, 'utf8') <= 75) return line;

  const chunks: string[] = [];
  let current = '';
  let currentBytes = 0;
  let limit = 75;

  for (const ch of line) {
    const chBytes = Buffer.byteLength(ch, 'utf8');
    if (currentBytes + chBytes > limit) {
      chunks.push(current);
      current = '';
      currentBytes = 0;
      limit = 74; // continuation lines reserve 1 octet for the leading space
    }
    current += ch;
    currentBytes += chBytes;
  }
  if (current) chunks.push(current);

  return chunks.join('\r\n ');
}

/** Parse a clock-time token's hour/minute + meridiem suffix into 24h h/m. */
function parseClock(hourStr: string, minuteStr: string, suffix?: string): { h: number; m: number } | null {
  let h = +hourStr;
  const m = +minuteStr;
  if (h > 23 || m > 59 || Number.isNaN(h) || Number.isNaN(m)) return null;

  if (suffix && /p/i.test(suffix)) {
    if (h < 12) h += 12;
  } else if (suffix && /a/i.test(suffix)) {
    if (h === 12) h = 0;
  } else if (!suffix) {
    // No suffix -> default PM (dinner-prep app dominant case).
    if (h >= 1 && h <= 11) h += 12;
    // h === 12 (noon) or h === 0 stay as-is.
  }

  return { h, m };
}

/** Parse a freeform clock string like "5:30 PM" via parseClock. */
function parseClockText(text: string): { h: number; m: number } | null {
  const match = /\b(\d{1,2}):(\d{2})\s*([ap]\.?m\.?)?/i.exec(text);
  if (!match) return null;
  return parseClock(match[1], match[2], match[3]);
}

const CLOCK_TIME_RE = /\b(\d{1,2}):(\d{2})\s*([ap]\.?m\.?)?/gi;

const DURATION_RE =
  /(\d+(?:\.\d+)?)\s*(?:-\s*(\d+(?:\.\d+)?))?\s*(hours?|hrs?|h|minutes?|mins?|min|m|seconds?|secs?|sec|s)\b/i;

/** Parse the first duration mention in text into minutes. Optional -- undefined if absent. */
function parseDurationMinutes(text: string): number | undefined {
  const match = DURATION_RE.exec(text);
  if (!match) return undefined;

  const value = match[2] !== undefined ? +match[2] : +match[1];
  const unit = match[3].toLowerCase();

  let factor: number;
  if (/^h/.test(unit)) factor = 60;
  else if (/^s/.test(unit)) factor = 1 / 60;
  else factor = 1; // minutes / m

  return Math.max(1, Math.round(value * factor));
}

const STRUCTURED_TIME_RE = /\{\s*time\s*:\s*([^}]+)\}/i;

const MONTH_NAME_TO_INDEX: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

const WEEK_OF_RE =
  /Week of\s+([A-Z][a-z]+)\s+(\d{1,2})(?:,\s*(\d{4}))?\s*-\s*(?:([A-Z][a-z]+)\s+)?(\d{1,2}),\s*(\d{4})/;

/**
 * Derive the week's start date from the markdown's H1 title (preferred) or
 * the filename's `YYYYMMDD-` prefix (fallback). Returns null if neither matches.
 */
export function deriveWeekStart(markdown: string, filename?: string): Date | null {
  const h1Match = /^#\s+(.+)$/m.exec(markdown);
  if (h1Match) {
    const titleMatch = WEEK_OF_RE.exec(h1Match[1]);
    if (titleMatch) {
      const [, monthName, startDay, startYear, , , endYear] = titleMatch;
      const monthIndex = MONTH_NAME_TO_INDEX[monthName.toLowerCase()];
      if (monthIndex !== undefined) {
        const year = startYear ?? endYear;
        return new Date(+year, monthIndex, +startDay);
      }
    }
  }

  if (filename) {
    const base = filename.split('/').pop() ?? filename;
    const fileMatch = /^(\d{4})(\d{2})(\d{2})-/.exec(base);
    if (fileMatch) {
      return new Date(+fileMatch[1], +fileMatch[2] - 1, +fileMatch[3]);
    }
  }

  return null;
}

// ============================================================================
// extractCookingEvents
// ============================================================================

interface MealAccum {
  title: string;
  quickReadDetails?: string;
  textParts: string[];
}

function cleanMealTitle(raw: string): string {
  return raw
    .replace(/^[✓✓]\s*/, '')
    .replace(/~~/g, '')
    .trim();
}

/**
 * Extract cooking/prep times from a week's Markdown source.
 * Handles clock times (3:00 PM, 5:30), semantic times ("dinner time"),
 * durations ("30 minutes"), and structured {time: ...} annotations.
 */
export function extractCookingEvents(markdown: string, weekStart: Date): CookingEvent[] {
  const tokens = marked.lexer(markdown);

  const meals: MealAccum[] = [];
  let h2Count = 0;
  let current: MealAccum | null = null;

  for (const token of tokens) {
    if (token.type === 'heading' && token.depth === 2) {
      h2Count += 1;
      if (h2Count === 1) {
        // First H2 is the grocery/list section -- skip it entirely.
        current = null;
        continue;
      }
      current = { title: cleanMealTitle(token.text), textParts: [] };
      meals.push(current);
      continue;
    }

    if (!current) continue;

    if (token.type === 'heading' && token.depth === 6) {
      current.quickReadDetails = token.text.trim();
      current.textParts.push(token.text);
      continue;
    }

    if (token.type === 'paragraph') {
      current.textParts.push(token.text);
    } else if (token.type === 'list' && 'items' in token) {
      for (const item of token.items as { text: string }[]) {
        current.textParts.push(item.text);
      }
    } else if (token.type === 'heading') {
      current.textParts.push(token.text);
    }
  }

  const events: CookingEvent[] = [];

  meals.forEach((meal, mealIndex) => {
    const slug = slugify(meal.title);
    const mealText = meal.textParts.join('\n');
    const durationMinutes = parseDurationMinutes(mealText);

    const makeStart = (h: number, m: number): Date =>
      new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + mealIndex, h, m, 0, 0);

    const push = (title: string, h: number, m: number) => {
      events.push({ title, start: makeStart(h, m), durationMinutes, mealSlug: slug });
    };

    // (a) structured override
    const structuredMatch = STRUCTURED_TIME_RE.exec(mealText);
    if (structuredMatch) {
      const clock = parseClockText(structuredMatch[1]);
      if (clock) {
        push(meal.title, clock.h, clock.m);
        return;
      }
    }

    // (b) quickRead headline (may yield multiple events)
    if (meal.quickReadDetails) {
      const fragments = meal.quickReadDetails.split('+');
      let any = false;
      for (const fragment of fragments) {
        const trimmed = fragment.trim();
        CLOCK_TIME_RE.lastIndex = 0;
        if (!CLOCK_TIME_RE.test(trimmed)) continue;
        const clock = parseClockText(trimmed);
        if (!clock) continue;
        any = true;
        push(`${meal.title} -- ${trimmed}`, clock.h, clock.m);
      }
      if (any) return;
    }

    // (c) prose fallback -- first clock time found, in document order.
    for (const part of meal.textParts) {
      const clock = parseClockText(part);
      if (clock) {
        push(meal.title, clock.h, clock.m);
        return;
      }
    }

    // (d) semantic fallback
    if (/dinner ?time/i.test(mealText)) {
      push(meal.title, 18, 0);
      return;
    }

    // (e) no events for this meal.
  });

  return events;
}

// ============================================================================
// buildIcs
// ============================================================================

function eventEnd(event: CookingEvent): Date {
  return new Date(event.start.getTime() + (event.durationMinutes ?? 60) * 60000);
}

/**
 * Build a valid ICS document covering the given events.
 * Pass one event for the per-recipe mini export, or the whole week for "Add all".
 *
 * opts.alarmMinutes controls the VALARM baked into every VEVENT -- the
 * "never-miss" channel that fires even if Cheffy's local notifications are
 * unavailable/denied/the site is closed, because the reminder lives in the
 * calendar app itself. Omitted/undefined -> default 15-minute-before alarm.
 * Explicit null -> no VALARM at all (old pre-alarm behavior, still used for
 * callers that don't want one). 0 or negative minutes still emit an alarm,
 * triggering at/after the event start (TRIGGER:PT0M).
 */
export function buildIcs(events: CookingEvent[], opts?: { alarmMinutes?: number | null }): string {
  const alarmMinutes = opts?.alarmMinutes === undefined ? 15 : opts.alarmMinutes;

  const lines: string[] = [];
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//food-of-the-week//cheffy//EN');
  lines.push('CALSCALE:GREGORIAN');

  events.forEach((event, i) => {
    const end = eventEnd(event);
    const uidSlug = event.mealSlug || 'cooking';
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uidSlug}-${toIcsUtc(event.start)}-${i}@food-of-the-week`);
    lines.push(`DTSTAMP:${toIcsUtc(new Date())}`);
    lines.push(`DTSTART:${toIcsUtc(event.start)}`);
    lines.push(`DTEND:${toIcsUtc(end)}`);
    lines.push(`SUMMARY:${escapeIcsText(event.title)}`);
    if (alarmMinutes !== null && alarmMinutes !== undefined) {
      const trigger = alarmMinutes > 0 ? `-PT${alarmMinutes}M` : 'PT0M';
      lines.push('BEGIN:VALARM');
      lines.push('ACTION:DISPLAY');
      lines.push(`DESCRIPTION:${escapeIcsText(event.title)}`);
      lines.push(`TRIGGER:${trigger}`);
      lines.push('END:VALARM');
    }
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');

  return lines.map(foldLine).join('\r\n') + '\r\n';
}

// ============================================================================
// googleCalendarUrl
// ============================================================================

/**
 * Build a Google Calendar "add event" template URL for a single event
 * (no download alternative).
 */
export function googleCalendarUrl(event: CookingEvent): string {
  const end = eventEnd(event);
  const dates = `${toIcsUtc(event.start)}/${toIcsUtc(end)}`;
  return (
    'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    `&text=${encodeURIComponent(event.title)}` +
    `&dates=${dates}`
  );
}
