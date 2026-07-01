# CALLBOARD -- troupe <-> producer

Async, non-blocking notice board (the backstage callboard). The Stage Manager and Director **post** short notices here; the Producer reads and replies on their own cadence. This is the running directive channel -- **not** a log, and **not** job state. Status and progress live in `/troupe report` and `/troupe walkthrough`; do not restate them here.

**Queue vs board (do not conflate):** the queue (`queue.json`, via `$QS`) is the source of truth for job state -- block/unblock lives there. This board only *announces* that the Producer needs to act. A gate-answer is applied to the queue with `$QS resolve-block`; the matching board notice is then pruned (Strike sweeps acted-on entries). Never edit the board to mirror the queue, or vice-versa.

**Format contract (keep it terse -- this got bloated last time):**
- One entry = one or two lines. Append newest at top.
- `- [YYYY-MM-DD type] one line. (optional 2nd line: link / criteria tally.)`
- `type` = `defer` (parked item) | `fyi` (reflection) | `gate` (needs an answer, non-blocking) | `pr` (PR proposal) | `block` (hard-block reason).
- No nested bullets, no headers per entry, no restating context. Link out, don't inline.
- **Prune on action:** once the Producer acts on an entry, delete it. The board stays short.

- [2026-07-01 fyi] Cheffy 7/9 done. Final two parts armed serialized: p7 reduced-motion (CSS sweep, both components) then p9 pe-build-gate (mount + `npm run build` gate, runs last, dep-gated on p7 audit-pass). DoD sign-off + PR proposal come on the next Director pass.
- [2026-07-01 gate] DOM smoke-harness (happy-dom/Playwright) for the interactive panel still unanswered. Its window has now CLOSED -- only a CSS sweep (p7) + the mount (p9) remain, no new handlers. A "yes" now = a separate post-DoD test-infra follow-up, not a gate on shipping. Reply yes to open that follow-up; else this drops at sign-off.
