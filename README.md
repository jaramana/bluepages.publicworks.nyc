# The Blue Pages

[The Blue Pages](https://bluepages.publicworks.nyc) is an independent
[publicworks.nyc](https://publicworks.nyc)
directory of the 307 organizations in New York City's agency list. Each listing
shows published leadership and reporting lines, with contacts and payroll counts
where sources can be matched.

## Data sources

| Source | Used for | Listings covered |
| --- | --- | --- |
| [NYC Agencies and Governance Organizations](https://data.cityofnewyork.us/d/t3jq-9nkf), `t3jq-9nkf` | Names, types, heads, reporting lines and websites | All 307 |
| [Green Book](https://data.cityofnewyork.us/d/mdcw-n682), `mdcw-n682` | Officials, divisions, addresses and phones | 101 |
| [Citywide Payroll](https://data.cityofnewyork.us/d/k397-673e), via [The Pay Gap](https://paygap.publicworks.nyc) | Fiscal-year staff counts, 2014–2025 | 82 |
| Official agency web pages | Logos used for identification | 114 |

## Method and limits

- The City agency list defines the 307 listings. Green Book and payroll records
  are joined by name or acronym, with manual mappings for exceptions. The
  [crosswalk report](research/crosswalk-report.md) lists records the join could
  not place.
- A dash means there is no value or match to show; it does not mean zero. The
  agency list gives no reporting line for 175 entries.
- An organization with two parents appears under the first in the Org Chart and
  under both in the outline view.
- Staff counts include active salaried, hourly and daily payroll records. They are
  therefore different from The Pay Gap's salaried-only counts.
- Green Book officials appear in source order, with at most 40 on one listing.
  Logos are available for 114 listings.

## Updates

The published files are snapshots taken on 25 September 2026. There is no full
fetch-and-validate pipeline or scheduled refresh. The Python script at
`research/scripts/join_sources.py` can rebuild the Green Book and payroll matches
when this repository sits beside The Pay Gap, but it does not publish a new
edition of every source. Each listing currently opens through `?a=<id>`; separate
static agency pages have not been built.

## Tools

Site: HTML, CSS and JavaScript, with vendored d3, d3-flextree and d3-org-chart for
the Org Chart. Source joining: Python standard library. Claude was used in
development.

## License and reuse

Code is [BSD 3-Clause licensed](LICENSE). City data retain their source terms.
Logos belong to their organizations and are shown for identification.
