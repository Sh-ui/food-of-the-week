// cheffySchedule.test.ts -- coverage for the pure week-schedule builder.
// Run via `npm test` (node --test tests/). Node 23 strips types natively.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_NOTIFICATION_CONFIG,
  resolveNotificationConfig,
  parseDtstarts,
  buildCookNotifications,
  buildLunchNotifications,
  buildSyncReminder,
  buildWeekSchedule,
  type LunchDay,
  type NotificationConfig,
} from '../src/utils/cheffySchedule.ts';

describe('parseDtstarts', () => {
  test('parses multiple DTSTARTs', () => {
    const ics = [
      'BEGIN:VEVENT',
      'DTSTART:20260713T173000Z',
      'END:VEVENT',
      'BEGIN:VEVENT',
      'DTSTART:20260715T230000Z',
      'END:VEVENT',
    ].join('\n');
    const got = parseDtstarts(ics);
    assert.equal(got.length, 2);
    assert.equal(got[0], Date.UTC(2026, 6, 13, 17, 30, 0));
    assert.equal(got[1], Date.UTC(2026, 6, 15, 23, 0, 0));
  });

  test('none found -> empty array', () => {
    assert.deepEqual(parseDtstarts('BEGIN:VCALENDAR\nEND:VCALENDAR'), []);
    assert.deepEqual(parseDtstarts(''), []);
  });

  test('malformed lines are ignored', () => {
    const ics = [
      'DTSTART:2026071ZT173000Z', // bad digits
      'DTSTART:20260713T1730Z', // missing seconds
      'DTSTART;VALUE=DATE:20260713', // not the matched form at all
      'DTSTART:20260714T090000Z', // valid, should still be found
    ].join('\n');
    const got = parseDtstarts(ics);
    assert.deepEqual(got, [Date.UTC(2026, 6, 14, 9, 0, 0)]);
  });

  test('non-string input -> empty array, never throws', () => {
    assert.deepEqual(parseDtstarts(null as unknown as string), []);
    assert.deepEqual(parseDtstarts(undefined as unknown as string), []);
  });
});

describe('resolveNotificationConfig', () => {
  test('undefined -> defaults', () => {
    assert.deepEqual(resolveNotificationConfig(undefined), DEFAULT_NOTIFICATION_CONFIG);
  });

  test('non-object input -> defaults', () => {
    assert.deepEqual(resolveNotificationConfig(null), DEFAULT_NOTIFICATION_CONFIG);
    assert.deepEqual(resolveNotificationConfig('nope'), DEFAULT_NOTIFICATION_CONFIG);
    assert.deepEqual(resolveNotificationConfig(42), DEFAULT_NOTIFICATION_CONFIG);
    assert.deepEqual(resolveNotificationConfig([]), DEFAULT_NOTIFICATION_CONFIG);
  });

  test('partial override merges over defaults', () => {
    const got = resolveNotificationConfig({ lunchTime: '12:30' });
    assert.equal(got.lunchTime, '12:30');
    assert.deepEqual(got.syncReminder, DEFAULT_NOTIFICATION_CONFIG.syncReminder);

    const got2 = resolveNotificationConfig({ syncReminder: { dow: 'monday' } });
    assert.equal(got2.lunchTime, DEFAULT_NOTIFICATION_CONFIG.lunchTime);
    assert.equal(got2.syncReminder.dow, 'Monday');
    assert.equal(got2.syncReminder.time, DEFAULT_NOTIFICATION_CONFIG.syncReminder.time);
  });

  test('bad time falls back to default field', () => {
    const got = resolveNotificationConfig({ lunchTime: '25:99', syncReminder: { dow: 'Sunday', time: '25:99' } });
    assert.equal(got.lunchTime, DEFAULT_NOTIFICATION_CONFIG.lunchTime);
    assert.equal(got.syncReminder.time, DEFAULT_NOTIFICATION_CONFIG.syncReminder.time);
  });

  test('bad dow name falls back to default field', () => {
    const got = resolveNotificationConfig({ syncReminder: { dow: 'Someday', time: '10:00' } });
    assert.equal(got.syncReminder.dow, DEFAULT_NOTIFICATION_CONFIG.syncReminder.dow);
    assert.equal(got.syncReminder.time, '10:00');
  });
});

describe('buildCookNotifications', () => {
  test('builds one notification per DTSTART, keeps copy exact', () => {
    const ics = 'DTSTART:20260713T173000Z';
    const got = buildCookNotifications([{ label: 'Taco Tuesday', ics }], '/week/2026-07-12');
    assert.equal(got.length, 1);
    assert.equal(got[0].kind, 'cook');
    assert.equal(got[0].title, 'Time to cook!');
    assert.equal(got[0].body, "Taco Tuesday -- it's cooking time.");
    assert.equal(got[0].url, '/week/2026-07-12');
    assert.equal(got[0].tag, got[0].id);
    assert.ok(got[0].id.startsWith(`cook-${Date.UTC(2026, 6, 13, 17, 30, 0)}-`));
  });

  test('empty label uses the fallback copy', () => {
    const got = buildCookNotifications([{ label: '', ics: 'DTSTART:20260713T173000Z' }], '/week');
    assert.equal(got[0].body, "It's cooking time.");
  });

  test('empty meals -> empty array', () => {
    assert.deepEqual(buildCookNotifications([], '/week'), []);
  });
});

describe('buildLunchNotifications', () => {
  const days: LunchDay[] = [
    { date: '2026-07-13', dow: 'Monday', name: 'Egg + fruit' },
    { date: '2026-07-14', dow: 'Tuesday', name: 'Banana + PB' },
  ];

  test('constructs local time, matching a manually-built local Date', () => {
    const got = buildLunchNotifications(days, '11:00', '/lunch');
    assert.equal(got.length, 2);
    assert.equal(got[0].whenMs, new Date(2026, 6, 13, 11, 0).getTime());
    assert.equal(got[1].whenMs, new Date(2026, 6, 14, 11, 0).getTime());
    assert.equal(got[0].title, 'Lunch time!');
    assert.equal(got[0].body, "Today's lunch: Egg + fruit");
    assert.equal(got[0].url, '/lunch');
    assert.equal(got[0].kind, 'lunch');
  });

  test('empty days -> empty array', () => {
    assert.deepEqual(buildLunchNotifications([], '11:00', '/lunch'), []);
  });

  test('bad date strings are skipped, not thrown', () => {
    const got = buildLunchNotifications(
      [{ date: 'not-a-date', dow: 'Monday', name: 'x' } as LunchDay, ...days],
      '11:00',
      '/lunch'
    );
    assert.equal(got.length, 2);
  });
});

describe('buildSyncReminder', () => {
  const config: NotificationConfig = { lunchEnabled: true, lunchTime: '11:00', syncReminder: { dow: 'Sunday', time: '09:00' } };

  test('afterMs on a Wednesday -> lands next Sunday 09:00 local', () => {
    // 2026-07-15 is a Wednesday.
    const afterMs = new Date(2026, 6, 15, 12, 0).getTime();
    const got = buildSyncReminder(afterMs, config, '/');
    assert.ok(got);
    assert.equal(got!.whenMs, new Date(2026, 6, 19, 9, 0).getTime()); // 2026-07-19 is a Sunday
    assert.equal(got!.title, 'New week is up!');
    assert.equal(got!.body, "Open Cheffy and tap 'sync reminders' to load this week's pings.");
    assert.equal(got!.kind, 'sync');
    assert.equal(got!.url, '/');
  });

  test('afterMs exactly at Sunday 09:00 -> jumps a full week (strictly after)', () => {
    // 2026-07-12 is a Sunday.
    const afterMs = new Date(2026, 6, 12, 9, 0).getTime();
    const got = buildSyncReminder(afterMs, config, '/');
    assert.ok(got);
    assert.equal(got!.whenMs, new Date(2026, 6, 19, 9, 0).getTime());
  });

  test('afterMs just before Sunday 09:00 -> same-day occurrence', () => {
    const afterMs = new Date(2026, 6, 12, 8, 0).getTime();
    const got = buildSyncReminder(afterMs, config, '/');
    assert.ok(got);
    assert.equal(got!.whenMs, new Date(2026, 6, 12, 9, 0).getTime());
  });

  test('month boundary rollover', () => {
    // 2026-07-29 is a Wednesday; next Sunday rolls into August.
    const afterMs = new Date(2026, 6, 29, 12, 0).getTime();
    const got = buildSyncReminder(afterMs, config, '/');
    assert.ok(got);
    assert.equal(got!.whenMs, new Date(2026, 7, 2, 9, 0).getTime()); // 2026-08-02 is a Sunday
  });

  test('invalid config beyond repair -> null', () => {
    const bad = { lunchTime: '11:00', syncReminder: { dow: 'Someday', time: '09:00' } } as NotificationConfig;
    assert.equal(buildSyncReminder(Date.now(), bad, '/'), null);
  });
});

describe('buildWeekSchedule', () => {
  test('sync reminder is last, past entries filtered, sorted ascending, ids unique', () => {
    const now = new Date(2026, 6, 13, 8, 0).getTime(); // Monday 08:00

    const meals = [
      { label: 'Past meal', ics: 'DTSTART:20260712T170000Z' }, // Sunday -- in the past relative to `now`
      { label: 'Taco Tuesday', ics: 'DTSTART:20260714T173000Z' }, // Tuesday evening
    ];
    const lunchDays: LunchDay[] = [
      { date: '2026-07-13', dow: 'Monday', name: 'Egg + fruit' }, // Monday 11:00, future
      { date: '2026-07-14', dow: 'Tuesday', name: 'Banana + PB' },
    ];

    const schedule = buildWeekSchedule({
      meals,
      lunchDays,
      config: DEFAULT_NOTIFICATION_CONFIG,
      urls: { week: '/week', lunch: '/lunch', home: '/' },
      now,
    });

    // The past-dated Sunday cook notification must be filtered out.
    assert.ok(!schedule.some((n) => n.body.includes('Past meal')));

    // Ascending order.
    for (let i = 1; i < schedule.length; i++) {
      assert.ok(schedule[i].whenMs >= schedule[i - 1].whenMs);
    }

    // Sync reminder is last.
    const last = schedule[schedule.length - 1];
    assert.equal(last.kind, 'sync');

    // Ids are unique.
    const ids = schedule.map((n) => n.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  test('dedupe by id keeps the first occurrence', () => {
    const now = new Date(2026, 6, 13, 8, 0).getTime();
    const ics = 'DTSTART:20260714T173000Z';
    const schedule = buildWeekSchedule({
      meals: [
        { label: 'Same Meal', ics },
        { label: 'Same Meal', ics }, // identical label + time -> identical id
      ],
      lunchDays: [],
      config: DEFAULT_NOTIFICATION_CONFIG,
      urls: { week: '/week', lunch: '/lunch', home: '/' },
      now,
    });
    const cookEntries = schedule.filter((n) => n.kind === 'cook');
    assert.equal(cookEntries.length, 1);
  });

  test('empty inputs still produce a sync reminder and never throw', () => {
    const now = new Date(2026, 6, 13, 8, 0).getTime();
    const schedule = buildWeekSchedule({
      meals: [],
      lunchDays: [],
      config: DEFAULT_NOTIFICATION_CONFIG,
      urls: { week: '/week', lunch: '/lunch', home: '/' },
      now,
    });
    assert.equal(schedule.length, 1);
    assert.equal(schedule[0].kind, 'sync');
  });

  test('lunchEnabled=false drops lunch pings but keeps cook + sync', () => {
    const now = new Date(2026, 6, 13, 8, 0).getTime();
    const config: NotificationConfig = {
      lunchEnabled: false,
      lunchTime: '11:00',
      syncReminder: { dow: 'Sunday', time: '09:00' },
    };
    const days: LunchDay[] = [{ date: '2026-07-14', dow: 'Tuesday', name: 'Greek yogurt + berries' }];
    const schedule = buildWeekSchedule({
      meals: [{ label: 'Tacos', ics: 'DTSTART:20260715T220000Z' }],
      lunchDays: days,
      config,
      urls: { week: '/week', lunch: '/lunch', home: '/' },
      now,
    });
    assert.equal(schedule.filter((n) => n.kind === 'lunch').length, 0);
    assert.equal(schedule.filter((n) => n.kind === 'cook').length, 1);
    assert.equal(schedule.filter((n) => n.kind === 'sync').length, 1);
  });

  test('resolveNotificationConfig folds lunchEnabled fail-soft', () => {
    assert.equal(resolveNotificationConfig({ lunchEnabled: false }).lunchEnabled, false);
    assert.equal(resolveNotificationConfig({ lunchEnabled: 'nope' }).lunchEnabled, true);
    assert.equal(resolveNotificationConfig(null).lunchEnabled, true);
  });
});
