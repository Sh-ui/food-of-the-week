// cheffyCalendarAlarm.test.ts -- coverage for buildIcs's VALARM support.
// Run via `npm test` (node --test tests/). Node 23 strips types natively.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildIcs, type CookingEvent } from '../src/utils/cheffyCalendar.ts';

function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

const events: CookingEvent[] = [
  { title: 'Miso Salmon', start: new Date(2026, 6, 13, 17, 30, 0), mealSlug: 'miso-salmon' },
  { title: 'Taco Night', start: new Date(2026, 6, 14, 18, 0, 0), mealSlug: 'taco-night' },
];

describe('buildIcs VALARM', () => {
  test('default (no opts) -> 2 VALARM blocks, -PT15M trigger', () => {
    const ics = buildIcs(events);
    assert.equal(countOccurrences(ics, 'BEGIN:VALARM'), 2);
    assert.equal(countOccurrences(ics, 'END:VALARM'), 2);
    assert.equal(countOccurrences(ics, 'TRIGGER:-PT15M'), 2);
  });

  test('alarmMinutes: null -> no VALARM blocks', () => {
    const ics = buildIcs(events, { alarmMinutes: null });
    assert.equal(countOccurrences(ics, 'BEGIN:VALARM'), 0);
    assert.equal(countOccurrences(ics, 'END:VALARM'), 0);
    assert.ok(!ics.includes('TRIGGER'));
  });

  test('alarmMinutes: 0 -> TRIGGER:PT0M', () => {
    const ics = buildIcs(events, { alarmMinutes: 0 });
    assert.equal(countOccurrences(ics, 'BEGIN:VALARM'), 2);
    assert.equal(countOccurrences(ics, 'TRIGGER:PT0M'), 2);
    assert.ok(!ics.includes('-PT0M'));
  });

  test('alarmMinutes: 30 -> -PT30M trigger', () => {
    const ics = buildIcs(events, { alarmMinutes: 30 });
    assert.equal(countOccurrences(ics, 'BEGIN:VALARM'), 2);
    assert.equal(countOccurrences(ics, 'TRIGGER:-PT30M'), 2);
  });

  test('undefined alarmMinutes (opts present, key omitted) -> default 15', () => {
    const ics = buildIcs(events, {});
    assert.equal(countOccurrences(ics, 'TRIGGER:-PT15M'), 2);
  });

  test('VEVENT begin/end counts stay matched regardless of alarm option', () => {
    for (const opts of [undefined, { alarmMinutes: null }, { alarmMinutes: 0 }, { alarmMinutes: 30 }]) {
      const ics = buildIcs(events, opts as any);
      const begins = countOccurrences(ics, 'BEGIN:VEVENT');
      const ends = countOccurrences(ics, 'END:VEVENT');
      assert.equal(begins, 2);
      assert.equal(ends, 2);
    }
  });
});
