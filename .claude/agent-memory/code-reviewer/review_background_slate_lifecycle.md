---
name: background-slate-lifecycle
description: refreshSlate (the range fetch) runs only at worker startup and on pref/league change — never on a timer; only tickLeague polls, and it uses the dateless scoreboard
metadata:
  type: project
---

In `apps/extension/entrypoints/background.ts`, non-demo polling is **per league only**:
`startLeaguePolling` → `setTimeout(tickLeague)`. `tick()` (the whole-slate refresh) runs at worker
startup and on a popup `forceRefresh`. `refreshSlate()` — the only caller that passes
`includeUpcoming: true`, and therefore the only one that issues the `dates=` **range** query — runs
at startup and inside the `UPDATE_PREFS` handler. It is never scheduled.

`tickLeague` fetches the **dateless** scoreboard, which per this repo's own findings carries only
the current US Eastern day, and replaces that league's games wholesale. Anything the range query
found that the dateless call cannot see must be carried across each tick by hand — which is why
`upcomingGames` and `retainedFinalGames` exist as separate module-level lists.

**Why:** per-league intervals throttle quiet leagues; the range query is expensive.

**How to apply:** when reviewing anything that has to survive across polls, ask two questions.
(1) Is it populated *only* by `refreshSlate`? If so it is a snapshot from worker start and will
never pick up a game that changed state mid-session. (2) Does `tickLeague` re-derive it, or does it
fall into `otherGames = games.filter(g => g.league !== leagueId)` and get carried untouched? The
second path means a per-game staleness/expiry check only runs when *that* league next ticks.
