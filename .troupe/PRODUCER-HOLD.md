# PRODUCER HOLD -- wind down, do NOT continue the loop

Set by the Producer 2026-07-01.

**Directive:** Stop the unattended loop as soon as it can wind down cleanly.

- Let the CURRENTLY-active part finish its in-flight rung/part naturally -- do NOT
  force-kill mid-rung, do NOT abandon a leased job.
- Once the active part reaches a clean boundary (rung burst returns / part audit-passes),
  the HOST must NOT spawn the next Stage Manager. Hold the baton. No `ScheduleWakeup`.
- Do NOT arm any further parts (4-6) until the Producer explicitly resumes with `/troupe`.

**Where we are at hold time:** parts 1-2 (floating-mascot, hat-bubble) done + audit-passed.
Part 3 (floating-card-panel) in flight. Parts 4-6 (polish, screenshot-gate, Opus
visual-review) not yet built.

**To resume:** delete this file, then `/loop /troupe` (or `/troupe`).
