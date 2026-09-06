---
name: project-store-listing-translations
description: 2026-09-05 — full browser-extension store listing (marketing/) translated into all 11 non-English locales; name_long.txt cap is 75 chars, not 132
metadata:
  type: project
---

Translated `apps/extension/marketing/{name_long.txt, short_summary_chrome.txt,
short_summary_edge_ff.txt, desc_long.md}` into all 11 non-English shipped locales
(`de, es, fil, fr, it, ja, ko, pt_BR, pt_PT, zh_CN, zh_TW`), each in its own
`marketing/<locale>/` directory. Added `marketing/README.md` explaining the layout and
why `kwords.txt` / `justifications/` stay English-only (keyword research is
locale-specific work, not translation; store reviewers read justifications in English).

**Corrected limit: `name_long.txt` (the Chrome Web Store listing title) is capped at 75
characters, not 132.** Ryan gave 132 first, then corrected it — 132 is the
`short_summary_chrome.txt` limit, and 75 is also the separate hard cap on the manifest
`name` field (confirmed against Chrome's own docs: "a short, plain text string (maximum
of 75 characters)"), so a title that fits one fits both. Ten of eleven translations were
already under 75 by luck; `fr` was not (77 chars) and got tightened to exactly 75 while
keeping "automatiquement" — the selling point is the *automatic* switch, so that word
was worth protecting over trimming elsewhere first. `es` (68), `it` (70), `pt_BR` (70)
and `pt_PT` (72) are close to the line but legal and were left alone.

**Terminology**: reused established `apps/extension/locales/<locale>.json` vocabulary
throughout rather than inventing new terms — signal names (`signalCloseness` etc.),
`sensitivityLabel`/`cooldownLabel`/`switchDelay.label`/`favoriteBonus.label`/`gameBoost`,
sport category names (`sport.basketball` etc.), and the tab/league/assign verbs each
locale already uses (e.g. de "Tab"/"Liga"/"zuweisen", fr "onglet"/"ligue"/"associer",
zh_CN "标签页"/"联赛"/"分配"). This is the same discipline as
[[project_pregame_probable_starters_and_leaders]] and
[[project_favorite_teams_settings_translations]] — read the locale file first, don't
freelance a parallel vocabulary for marketing copy the user will read right next to the
product.

**League names/abbreviations left untranslated on purpose**, including modifiers like
"Men's"/"Women's"/"Olympic" (e.g. "NCAA Men's", "Olympic Women's Ice Hockey") — confirmed
these never appear translated anywhere in the 12 locale JSONs because they're ESPN-sourced
league labels the UI renders verbatim in English regardless of locale (see the 2026-09-05
CHANGELOG entry on favorite-team settings, which explicitly notes "Olympic Women's Ice
Hockey" rendering untranslated). Only the sport *category* headings (Basketball, Football,
Hockey, Baseball & Softball, Soccer) get translated, mirroring `sport.*` keys. The same
"proprietary event name, keep it in Latin script everywhere" logic was extended to "March
Madness" when drafting the manifest name below — ja and ko keep it as Latin text rather
than transliterating/translating it, matching how NCAA itself is always kept literal.

**"Standby Stream" kept literal as a heading in every locale**, per
[[project_brand_term_leakage]] (RESOLVED 2026-08-19: always literal, no exceptions,
supersedes the older CJK prose/heading split memory for this specific term). The
"designated Standby tab" phrase in the description is different — that's the generic
"standby tab" wording from `setup.standbyTab`, which *is* translated per locale (de
"Standby-Tab", es "Pestaña de espera", fr "Onglet de standby", it "Scheda standby", fil
"Standby na Tab", ja "スタンバイタブ", ko "대기 탭", pt_BR "Aba de espera", pt_PT
"Separador de espera", zh_CN "待机标签页", zh_TW "待機分頁") — matched that pattern in
the marketing copy too.

**A German grammar bug survived my own self-check and was caught by Ryan**, not by
re-reading the file: `de/desc_long.md` step 3 originally read "Der richtige Tab wird
stummgeschaltet aufgehoben, die anderen werden stummgeschaltet" — a separable verb
(`aufheben`) assembled with the wrong participle sitting where the separated prefix
should be; it reads as "muted lifted" rather than "the mute is lifted." Fixed to "Die
Stummschaltung des richtigen Tabs wird aufgehoben, die anderen werden stummgeschaltet."
**Takeaway: when translating a sentence with a passive + separable-verb construction in
German, read it back as a German sentence in isolation, not just checked against the
English source word-for-word** — the other four Romance-language versions of the same
sentence (fr/es/it/pt_BR) were clean, so this was German-specific syntax risk, not a
translation-fidelity gap.

**Character limits verified**: `name_long.txt` all ≤75 after the fr fix (widest now is fr
at exactly 75); `short_summary_chrome.txt` all ≤132 (widest pt_PT at 128).
`short_summary_edge_ff.txt` has no hard cap; fr came in widest at 215 vs English's 193,
still fine. `desc_long.md` structure (12 `━━━` rule lines, 5 sport emoji each once, 83
CRLF-terminated lines matching English exactly) verified identical across all 11
translations. **All limits are character counts, not byte counts** — this matters most
for the CJK locales, where `wc -c` badly overstates how close a string is to the cap;
count code points (Python `len()` on a decoded string), not bytes. This same
char-vs-byte note is now in `marketing/README.md` for the next person who touches these
files.

**Manifest name/description** (`apps/extension/wxt.config.ts`, not touched — reported
only): Ryan initially gave a 45-char limit for the manifest `name` field, which was his
error — the real Chrome limit is 75 characters, same as `name_long.txt` above. The
existing hardcoded English manifest name, "ArenaSwap — Auto-Switch Live NFL, NBA,
MarchMadness & MLB Games" (63 chars), is therefore fine as-is and was NOT replaced. The
translations to hand off are of that actual 63-character string (not a compressed
substitute), each verified ≤75 chars: de 69, es 69, fil 65, fr 74, it 71, ja 42 (uses
Latin "March Madness"), ko 53 (same), pt_BR 69, pt_PT 74, zh_CN 44, zh_TW 44. The manifest
`description` (130 chars, within its own 132-char limit) reuses each locale's
`short_summary_chrome.txt` translation rather than a separate draft, since the two fields
serve the same purpose under the same limit. Wiring this onto
`__MSG_name__`/`__MSG_description__` plus a `_locales/<locale>/messages.json` per locale
is unstarted — flagged to Ryan, not built, since editing `wxt.config.ts` was explicitly
out of scope.
