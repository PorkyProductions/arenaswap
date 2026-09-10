---
name: ludicrous-speed-proposal
description: PR #123 rebuilds the Ludicrous Speed easter egg with 3 switchable variants; awaiting Ryan's choice of direction before it can merge
metadata:
  type: project
---

PR [#123](https://github.com/hiteacheryouare/arenaswap/pull/123) on branch `ludicrous-speed-movie-accurate` (base `dev`, opened 2026-09-10) proposes three switchable readings of the Spaceballs Ludicrous Speed overlay — BRIDGE, EXTERIOR and IN THE WARP. It is **explicitly not a merge candidate**.

**Why:** Ryan asked for 2–3 variants to react to and pick between, not one refined take. The variant cycler, its on-screen badge, the `f`/`n`/`→` transport keys and the `.proposal/` screenshot folder (~5.7 MB) are all scaffolding that must be deleted once a direction is chosen. No CHANGELOG entry was written, by instruction — it lands with the chosen direction.

**How to apply:** If Ryan returns to this, the follow-up work is: delete the two rejected variants and the switcher, add the CHANGELOG entry, and settle the one English-only string (`WE BRAKE FOR NOBODY` on the exterior bumper placard) across the 12 locales or decide it stays untranslated like the ESPN round names. Do not assume the proposal shipped as-is.

The film research behind it is expensive to re-acquire and is recorded in the PR body and in source comments (Cinefex #31 is the primary source; the effect is slit-scan, and the plaid is **not** Royal Stewart). Read those before re-researching.

Related: [[no-worktrees]] — this work stayed on a branch in the shared checkout rather than a worktree, per Ryan's standing rule.
