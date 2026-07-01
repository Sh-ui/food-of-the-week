# CALLBOARD -- troupe <-> producer

Async, non-blocking notice board (the backstage callboard). The Stage Manager and Director **post** short notices here; the Producer reads and replies on their own cadence. This is the running directive channel -- **not** a log, and **not** job state. Status and progress live in `/troupe report` and `/troupe walkthrough`; do not restate them here.

**Queue vs board (do not conflate):** the queue (`queue.json`, via `$QS`) is the source of truth for job state -- block/unblock lives there. This board only *announces* that the Producer needs to act. A gate-answer is applied to the queue with `$QS resolve-block`; the matching board notice is then pruned (Strike sweeps acted-on entries). Never edit the board to mirror the queue, or vice-versa.

**Format contract (keep it terse -- this got bloated last time):**
- One entry = one or two lines. Append newest at top.
- `- [YYYY-MM-DD type] one line. (optional 2nd line: link / criteria tally.)`
- `type` = `defer` (parked item) | `fyi` (reflection) | `gate` (needs an answer, non-blocking) | `pr` (PR proposal) | `block` (hard-block reason).
- No nested bullets, no headers per entry, no restating context. Link out, don't inline.
- **Prune on action:** once the Producer acts on an entry, delete it. The board stays short.

- [2026-07-01 fyi] Cheffy 2/9 done (calendar-engine, mascot-state-machine; both audit+test passed). No test framework by design -- ephemeral Node scripts + `npm run build` are the durable gate.
  Gap worth a call: the interactive DOM surface (state machine; from part 3 the dialogue nav + action registry) has NO executable coverage -- only astro check + manual audit. Parts 5-6 (local-notifications, checklist-export-import) are now armed = the LAST window to add a light DOM smoke harness (happy-dom/Playwright) cheaply, before part 9 mounts + freezes the panel. Director is NOT blocking 5-6 on this (same bar carried part 4). Reply if you want one added before part 9; else we proceed as-is.
