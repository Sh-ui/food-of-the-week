# CALLBOARD -- troupe <-> producer

Async, non-blocking notice board (the backstage callboard). The Stage Manager and Director **post** short notices here; the Producer reads and replies on their own cadence. This is the running directive channel -- **not** a log, and **not** job state. Status and progress live in `/troupe report` and `/troupe walkthrough`; do not restate them here.

**Queue vs board (do not conflate):** the queue (`queue.json`, via `$QS`) is the source of truth for job state -- block/unblock lives there. This board only *announces* that the Producer needs to act. A gate-answer is applied to the queue with `$QS resolve-block`; the matching board notice is then pruned (Strike sweeps acted-on entries). Never edit the board to mirror the queue, or vice-versa.

**Format contract (keep it terse -- this got bloated last time):**
- One entry = one or two lines. Append newest at top.
- `- [YYYY-MM-DD type] one line. (optional 2nd line: link / criteria tally.)`
- `type` = `defer` (parked item) | `fyi` (reflection) | `gate` (needs an answer, non-blocking) | `pr` (PR proposal) | `block` (hard-block reason).
- No nested bullets, no headers per entry, no restating context. Link out, don't inline.
- **Prune on action:** once the Producer acts on an entry, delete it. The board stays short.

- [2026-07-01 fyi] Workshop sweep done (debt 8->0). Queue healthy: 64 done, P3 batch armed clean, 0 blocked/failed/crashed. 3 platform gaps flagged to maintainer (see workshop report): (a) `queue_state.py` has NO prune/gc subcommand, so the done-tail (145KB, incl. 15 superseded behavior-DoD jobs) cannot be GC'd; (b) `order[]` has 4 dead duplicate IDs (order-append not idempotent -- harmless, done jobs); (c) `state.json.aggregates` all zero (telemetry not populated -- cost scorecard unmeasurable). Thresholds HOLD (no thrash: retries converged <=2).
- [2026-07-01 fyi] Parts 1-2 (floating-mascot, hat-bubble) both audit-passed clean; batch settled. For the 5b review: crit2's "four expression states" = the four #cheffy data-state values (idle/attention/dialogue/processing), NOT four expr variants -- the SVG has 3 data-expr eye groups (neutral/excited/thinking) + 3 mouths + the notif dot; there is NO "sleepy" state (bootstrap paraphrase was loose).
- [2026-07-01 defer] DOM smoke-harness (happy-dom/Playwright) for the interactive panel -- parked as a post-ship test-infra follow-up, NOT a ship blocker (no committed test framework by design; `npm run build` is the durable gate). Open only if wanted after ship.
