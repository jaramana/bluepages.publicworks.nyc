# Design log

Five prototypes, 2026-09-25. All live in `prototypes/` and share `prototypes/shared/data.js` and `prototypes/shared/logos/`.

| Prototype | Idea | Verdict |
| --- | --- | --- |
| A, `a-modern` | Sibling-site restraint, sans, hairlines, ochre accent | Rejected. Too conventional and boring |
| B, `b-bold` | Neo-brutalist civic: taxi yellow, habitat colors, hard shadows | Rejected. Too much noise |
| C, `c-textbook` | The site rebuilt as a literal book: cover, endpapers, spreads, page numbers | Rejected. The textbook was meant as a sensibility, not an interface |
| D, `d-reference` | Working reference site with a fine textbook's manners | Superseded by E. Layout kept, palette too sepia |
| E, `e-directory` | D's two panes, plain directory styling, three switchable looks, joined data, zoomable org chart | Current direction, pending Allen's review |

## Feedback that shaped D

- Whimsy stays out of data and written entry content. "Field note" captions ("The common city species...") were too on the nose.
- Avoid the stock publicworks structure: header nav, big title, subtitle, three metrics.
- The textbook metaphor: the handsome, overpriced reference book a new hire at the Mayor's Office of Operations or NYCEM is issued in 2027. Photo-book print quality, soft-touch cover, expected back on separation, out of date every year. Use it as a mood during design, not as a layout to reproduce.

## What D does

- Two panes. Left: persistent index rail with lookup, part filters I to IX, all 307 entries grouped by part. Right: the selected entry or a view.
- Views in one page, state in the URL: `?a=<id>` entry, `?view=chart`, `?view=exam`, `?view=about`, `?part=IV` filter.
- Entry: logo as a captioned plate ("Plate 26"), part kicker, name, acronym, one-line lead built from data, facts table with a margin note naming each source field, related entries, previous and next.
- Organization chart: collapsible outline from `reports_to`. Blank rows sit in a labelled "No reporting line listed" group.
- Examination: 8 generated questions (logo, acronym, head, reports-to), answer bubbles, red-pen marking, personal best in `localStorage`, copy-result text.
- Textbook nods, all decorative: serif text on paper tone, oxblood ribbon marking the selected row, edition line, "Supersedes all previous editions", return-on-separation fine print in the colophon.
- Narrow screens: one pane at a time, "Index" back link on entries.

## Lessons to avoid retracing

- Fake agency names in the quiz read as on-the-nose content. Keep quiz content real.
- "307 bodies govern NYC" is false: the list includes museums and conservancies. Claims about the list must match what it contains.
- A cover line such as "The City of New York" implies an official publication. Publisher mark is publicworks.nyc.
- CSS `aspect-ratio` on a grid item lets tall content widen the column. Put `min-width: 0` on the item, or set the ratio on the container.
- The preview helper cannot read files under Desktop. Start the server from a terminal and attach (see `.claude/launch.json`).

## Feedback that shaped E

- Keep D's two panes: index on the left, content on the right.
- D leaned too far into yellow, red and sepia, which reads as a stock AI palette. Go simpler, try primary colors.
- Reference: civilservice.publicworks.nyc (white sheet, hard black rules, one civic blue, mono for City-assigned codes).
- The org chart should be dynamic and fun to explore.

## What E does

- Same views and URL state as D, plus `?focus=<id>` on the chart.
- Three looks behind a prototype switcher: Bulletin (civilservice kin), Primary (flat red, blue, yellow, black), Blue Pages (phone-book government section, narrow type, dot leaders).
- Four part families coded with primaries: Mayoral blue, elected and independent red, boards yellow, outside the Mayor's line gray or black.
- Sans throughout (Inter, Archivo Narrow for Blue Pages), IBM Plex Mono for codes and source notes. Serif dropped.
- Entry adds Green Book address, main phone and officials, and payroll headcount with a 12-year sparkline and median salary.
- Org chart uses d3-org-chart (MIT): pan, zoom, expand by branch, find, sideways or top-down, optional Green Book divisions, PNG export. Outline view kept as the accessible fallback.
- Name switcher with five candidates.

## Lessons from E

- d3-org-chart's `_expanded` flag shows a node by opening its ancestors. To open a node's children, flag the children.
- Top-down layout with 20+ root children is unreadably wide. Sideways layout centered on the Mayor reads well.
- Auto-matching names must skip keys that normalize to an empty string, or unrelated rows collapse onto one entry.

## Round two on E (same day)

Feedback applied:

- Working name The Blue Pages. Primary look only; switcher removed.
- Edition line removed. Footer states when data was retrieved.
- Textbook remnants removed: previous and next links, "parts", Roman numerals, listing numbers, duplicate kicker headings.
- Dataset codes and raw column names removed from pages. Each fact names its source in plain words ("Agency list", "Green Book", "City payroll"), linked to a Sources list.
- Fixed template: every listing shows the same eight facts and sections. Missing values show a dash.
- "Same reporting line" became "Also reporting to the [parent]". "Reports to this body" became "Who reports here".
- Search placeholder is "Look up an agency". A head's name still finds the listing, with a small note.
- Filters: Type and Staff dropdowns (multi-select) and a Sort dropdown (A to Z, most staff). All in the URL.
- Median salary removed.
- Org Chart: detail panel on click, highlight by type, index clicks find a listing in the chart, compact toolbar with a More menu.

Lesson: when Allen asks for fixed templates, a dash beats a hidden row. A short fixed template with dashes orients; many empty sections do not.
