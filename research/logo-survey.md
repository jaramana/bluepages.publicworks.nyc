# Logo and structure survey

Run 2026-09-25 against NYC Open Data `t3jq-9nkf` (307 rows).

## Logos

| Group | Rows | Result |
| --- | --- | --- |
| `nyc.gov/site/...` pages | 152 | 114 header logos found automatically; 7 pages errored; rest have no header logo |
| Other domains | 127 | Sample of 15: 11 expose a logo candidate, but markup varies; needs a hand-picked URL per agency |
| No URL in source | 28 | Placeholder unless found by hand |

- nyc.gov path pattern: `/assets/{slug}/images/content/header/{file}`. 67 PNG, 47 SVG.
- Logos are full color on transparent, designed for light backgrounds.
- PNGs are about 100 px tall. Fine for web, too small for print. SVGs scale for print.
- 103 unique files across 114 rows. Some divisions and boards reuse a parent logo (Finance on 3 rows, Records on 3). Flag these as "parent logo", not the body's own.
- nyc.gov misses include City Planning, OMB, TLC, and Immigrant Affairs. These likely use a different page template; check by hand.

Estimate from the sample, not a census: roughly 110 automatic, 60 to 90 more by hand-curated URL, the rest placeholder.

## Reports-to structure

- `reports_to` is blank for 175 of 307 rows (57%).
- 29 values name a parent absent from the table ("Chief of Staff", "Mayor").
- Some rows have two parents, separated by `;`.
- Deepest chain in the table is 3 levels (Sheriff, Office of Information Privacy, Office of Community Hiring).
- 47 rows list former or alternate names.

An org chart built from this table alone is thin. Supplement from the official nyc.gov org chart before drawing it.
