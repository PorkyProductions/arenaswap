# Marketing copy

Store-listing copy for the browser extension, one directory per locale. English lives at the
top level of `marketing/`; every other shipped locale gets its own subdirectory named after the
locale code used in `apps/extension/locales/` (`de`, `es`, `fil`, `fr`, `it`, `ja`, `ko`, `pt_BR`,
`pt_PT`, `zh_CN`, `zh_TW`).

Each locale directory holds the same four files, under the same filenames as the English
originals:

| File | Feeds | Limit |
| --- | --- | --- |
| `name_long.txt` | Chrome Web Store listing title | 75 characters max — this is also the hard cap on the manifest `name` field, so a name that fits here also fits there |
| `short_summary_chrome.txt` | Chrome Web Store short description | 132 characters max |
| `short_summary_edge_ff.txt` | Edge / Firefox short description | no hard cap; keep it near the English length (~200 characters) |
| `desc_long.md` | The full store description, all stores | 16,000 characters max |

`desc_long.md` uses `━━━` rule lines around section headings and one sport emoji per league
group. Every translation preserves the exact rule lines, emoji, section order and line breaks —
only the heading text and prose are translated. League names, abbreviations and streaming
service names are never translated (`NFL`, `NCAA`, `La Liga`, `ESPN+`, etc.), matching how the
extension itself renders them.

`name_long.txt` and `short_summary_chrome.txt` are hard Chrome Web Store limits — a submission
over either is rejected outright, not just truncated. Both are checked with a plain character
count (not bytes) before anything ships.

Every limit above is a count of **characters**, not bytes. A CJK title made of two-byte or
three-byte UTF-8 characters therefore has far more room under a 75- or 132-character cap than
its byte length suggests — don't reach for `wc -c` or a byte length when checking these; count
code points (e.g. Python's `len()` on a decoded string, not on raw bytes).

## What's deliberately English-only

- **`kwords.txt`** — the search-keyword list at the top level of `marketing/`. Keywords need
  locale-specific research (what people actually search for in that market and language), not a
  translation of the English list — a literal translation of "redzone" or "fantasy" doesn't
  carry the same search intent in, say, Japanese or Korean. This is future work, done per locale
  when someone sits down with that market's search data.
- **`justifications/`** — the permission-justification copy submitted to store reviewers. Chrome
  Web Store and the other stores review these in English regardless of the listing's locale, so
  translating them buys nothing and adds a maintenance burden every time a permission changes.

Neither directory is duplicated per locale.
