// cheffyCalendar.ts -- time extraction + calendar export for Cheffy. STUB / SCAFFOLD.
// Full design contract: ../../CHEFFY-SYSTEM.md > Feature: Calendar event sync.
//
// Kept UI-independent so it can be unit-tested on its own. The real build-out
// fills in the parsing + ICS assembly; signatures below are the contract.

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

/**
 * Extract cooking/prep times from a week's Markdown source.
 * Handles clock times (3:00 PM, 5:30), semantic times ("dinner time"),
 * durations ("30 minutes"), and structured {time: ...} annotations.
 * TODO(cheffy): implement; see CHEFFY-SYSTEM.md.
 */
export function extractCookingEvents(_markdown: string, _weekStart: Date): CookingEvent[] {
  return [];
}

/**
 * Build a valid ICS document covering the given events.
 * Pass one event for the per-recipe mini export, or the whole week for "Add all".
 * TODO(cheffy): implement RFC 5545 VEVENT assembly.
 */
export function buildIcs(_events: CookingEvent[]): string {
  return 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//food-of-the-week//cheffy//EN\nEND:VCALENDAR\n';
}

/**
 * Build a Google Calendar "add event" template URL for a single event
 * (no download alternative). TODO(cheffy): implement template URL params.
 */
export function googleCalendarUrl(_event: CookingEvent): string {
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE';
}
