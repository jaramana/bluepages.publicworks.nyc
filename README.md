# The Blue Pages

An independent directory of the 307 organizations in New York City's agency
list, from departments and elected offices to boards and nonprofits. Each
listing shows its published leadership and reporting line. Where records can be
matched, it also shows Green Book contacts and City payroll counts.

The site is at [bluepages.publicworks.nyc](https://bluepages.publicworks.nyc).
It is an independent project, not affiliated with, endorsed by, or produced by
the City of New York. For authoritative information, see
[NYC.gov](https://www.nyc.gov/main/your-government/agency-directory).

## Data sources

| Source | What it gives | Matched listings |
| --- | --- | --- |
| [NYC Agencies and Governance Organizations](https://data.cityofnewyork.us/d/t3jq-9nkf) | Names, types, heads, reporting lines, websites | All 307. It defines the listings |
| [Green Book](https://data.cityofnewyork.us/d/mdcw-n682) | Officials, divisions, addresses, main phone numbers | 101 |
| [Citywide Payroll](https://data.cityofnewyork.us/d/k397-673e), via [The Pay Gap](https://paygap.publicworks.nyc) | Staff counts per fiscal year, 2014 to 2025 | 82 |
| Official agency web pages | Logos, shown for identification | 114 |

## How the sources fit together

The agency list defines the entries. Green Book and payroll records are matched
by name or acronym, with manual mappings for exceptions.
`research/scripts/join_sources.py` does the matching and writes
`research/crosswalk-report.md`, which lists every record it could not place.

A dash on the site means the directory has no value or match to show. It does
not mean zero.

Staff counts are payroll records marked active in a fiscal year, across
salaried, hourly and daily pay. The Pay Gap counts salaried staff only, so its
figures run lower.

## Known gaps

- The agency list gives no reporting line for 175 of 307 entries. A blank field
  does not establish that an organization has no parent.
- An entry with two parents hangs from the first in the Org Chart. The outline
  view shows it under both.
- Logos cover 114 of 307 entries, all from nyc.gov pages.
- Green Book officials appear in source order, capped at 40 per entry.
- There is no build pipeline yet. The data files in `docs/data/` are snapshots
  taken on 25 September 2026.

## Tools used

Vanilla HTML, CSS and JavaScript for the site, with
[d3-org-chart](https://github.com/bumbeishvili/org-chart) for the Org Chart,
vendored into `docs/vendor/`. Python standard library for the join script.
Claude for development.

## Usage

To look at the site locally:

```bash
python3 -m http.server 8765 --directory docs
```

Then open `http://localhost:8765`.

To rebuild the Green Book and payroll joins, put
[paygap.publicworks.nyc](https://github.com/jaramana/paygap.publicworks.nyc)
beside this repository, then run:

```bash
python3 research/scripts/join_sources.py
```

## Repository layout

| Path | What it is |
| --- | --- |
| `docs/` | The published site, served by GitHub Pages |
| `docs/js/app.js` | The whole app: listing, Org Chart, Quiz, About |
| `docs/data/` | Agency list, Green Book and payroll snapshots |
| `docs/logos/` | Logo files from nyc.gov pages |
| `docs/vendor/` | d3, d3-flextree and d3-org-chart |
| `research/` | Design log, source surveys, roadmap, crosswalk report |
| `research/scripts/` | The join script and logo survey scripts |

## License

Code is released under the
[BSD 3-Clause license](https://opensource.org/licenses/BSD-3-Clause). The
underlying data is published by the City of New York and carries its terms.
Logos belong to their organizations and are shown for identification only.
