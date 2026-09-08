---
name: project-box-namespace-terminology
description: Terminology decisions for the `box` namespace (98-key box score section) added 2026-09-07 across all 11 non-English locales
metadata:
  type: project
---

`apps/extension/locales/*.json` gained a `box` namespace (98 keys, box score section on
the game detail screen), inserted immediately after `detail` in all 12 files. Translated
into de, es, fil, fr, it, ja, ko, pt_BR, pt_PT, zh_CN, zh_TW on 2026-09-07.

**Core rule, extending [[reference_locale_file_format]]'s established precedent**: for
narrow-column stat abbreviations (the ~37 keys from `runs` through `savePct`), every
locale except German, French and Chinese copies the English abbreviation verbatim —
this matches the already-shipped `detail.leaderAvg`…`leaderReceiving` keys, where even
Spanish, Italian, Portuguese, Japanese, Korean and Filipino keep `AVG`/`HR`/`RBI`/`PTS`
in English despite some of those languages (Spanish baseball, Japanese/Korean baseball)
having their own genuine native stat vocabulary. **Do not introduce native baseball/
football abbreviations for es/fil/fr/it/ja/ko/pt_BR/pt_PT even where you know a real one
exists** — consistency with the shipped leader block outranks authenticity here, per
Ryan's explicit instruction on this task.

**Established exceptions, all inherited from the leader block:**
- German hockey: `goals` → `T` (Tore). `hockeyAssists` stayed `A`, identical to English,
  because that's what `leaderHockeyAssists` already shipped as.
- French hockey: `goals` → `B` (buts). `hockeyAssists` likewise stays `A`.
- Chinese (both): baseball trio localized in full — `runs`→得分/得分, `hits`→安打,
  `errors`→失误/失誤, `hitsAtBats`→安打-打数/安打-打數, `rbi`→打点/打點,
  `homeRuns`→全垒打/全壘打, `walks`→保送, `strikeouts`→三振, `inningsPitched`→局数/局數,
  `earnedRuns`→自责分/自責分. Basketball: `points`→得分, `rebounds`→篮板/籃板,
  `assists`→助攻, `fieldGoals`→投篮/投籃, `threePointers`→三分. Hockeys's `goals`→进球/進球,
  `hockeyAssists`→助攻 (reuses the basketball assist word — Chinese doesn't lexically
  distinguish). Confirmed via CBA/CPBL box-score conventions, not guessed.
- Everything else — all American-football abbreviations, all hockey stats beyond
  goals/assists (`plusMinus`, `shots`, `penaltyMinutes`, `timeOnIce`, `goalsAgainst`,
  `shotsAgainst`, `saves`, `savePct`), `minutes`, `average` — stays English in **every**
  locale including Chinese. `average` in particular is reused across a baseball-AVG
  context and a football per-attempt-yards context, so translating it natively in any
  one language risks mislabeling the other sport.

**Taiwan/mainland basketball vocabulary genuinely differs**: `blocks` is 盖帽 (gài mào)
in zh_CN (mainland/CBA convention) but 阻攻 (zǔ gōng) in zh_TW (Taiwan SBL/P.LEAGUE+
convention) — not a typo, a real regional split. `steals` is 抢断/搶斷 in both (CBA
term, confirmed by search). Soccer's penalty kick is 点球/點球 in both (Taiwan Mandarin),
**not** 十二碼 — that literal "12-yard ball" term is Hong Kong Cantonese usage and does
not belong in zh_TW (Taiwan Mandarin, traditional characters but a different register).

**Group 3 (team-comparison full-word labels, ~33 keys, `possession`…`takeaways`)** were
translated properly per language rather than kept English, since these sit on a wide row
rather than a narrow column. American-football vocabulary leans on real loanword
patterns confirmed by research into each language's actual NFL coverage: German and
French keep "Down"/"Yards"/"Turnover" as loanwords (ran.de, RMC Sport style); Spanish
uses "yardas"/"acarreo"/"castigos" (ESPN Deportes style); Japanese and Korean render
American-football terms as katakana/Hangul phonetic loanwords (ファーストダウン,
퍼스트다운) per NFL Japan's and Korean sports media's own glossaries; Portuguese
(both variants) uses "jardas"/"down" per ESPN Brasil style.

**Filipino (`fil`) stays Taglish** per [[reference_locale_file_format]]'s existing
register note: sport-specific vocabulary (batting, pitching, passing, rushing,
receiving, forwards, defensemen, possession, offsides, etc.) is kept in English
inside Filipino sentence structure, matching how PBA/UAAP broadcasts actually talk.
Only connector/instructional words (`Ipakita lahat ng {count}`, `Depensa`, `Mga
manlalaro`) are in Filipino.

Related: [[reference_locale_file_format]], [[project_locale_codes]]
