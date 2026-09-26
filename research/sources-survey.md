# Second sources survey

2026-09-25. Checked against live data. Join details in `crosswalk-report.md`, produced by `scripts/join_sources.py`.

## Green Book, `mdcw-n682`

| Key | Value |
| --- | --- |
| What it is | The City's official directory, one row per listed official |
| Rows | 2,600 across 124 agency names |
| Sections | City 2,358, County 131, Courts 111 |
| Fields that matter | `office_title`, person name, `division_name`, `parent_division`, `grand_parent_division`, address, `agency_primary_phone` |
| Division fill | `division_name` 1,875 rows, `parent_division` 762, `grand_parent_division` 137, great-grandparent 0 |
| Last updated | September 2026 |

- Joins to 101 of 307 entries. Covers nearly every core agency.
- Adds what `t3jq-9nkf` lacks: named officials with titles, internal divisions up to three levels, street address, main phone.
- Does not add reporting lines between agencies. `reports_to` gaps stay.
- Names use the same inverted style as our `alpha` field ("Finance", "Parks, NYC"). A small hand crosswalk covers the rest.
- All five DAs share one name. The script splits them by office city.
- 26 names have no entry: state courts, county clerks, borough historians. These are a possible new part, not a join failure.
- Individual phone numbers are in the source. The prototype shows only the agency main line. Decision pending.

## Payroll via paygap.publicworks.nyc

| Key | Value |
| --- | --- |
| Source | Citywide Payroll Data `k397-673e`, summarized in `paygap.publicworks.nyc/docs/downloads/` |
| Grain | Payroll agency code by fiscal year, FY2014 to FY2025 |
| Codes | 168 |
| Used | `headcount_by_agency.csv`, `real_wages_by_agency.csv` |

- Joins to 82 entries. 71 codes have no entry, almost all community boards (59) and CUNY colleges.
- Some entries take several codes. Public Schools takes seven DOE codes. The prototype sums headcount and hides the median when codes are combined, since medians do not add.
- Renamed agencies show up as code changes: CONSUMER AFFAIRS to CONSUMER AND WORKER PROTECTION, DEPT OF INFO TECH & TELECOMM to TECHNOLOGY & INNOVATION. Useful for the history view.
- Covers the Phase 2 "follow the money" headcount question now, for core agencies.

## History sources, for later

| Source | Span | Notes |
| --- | --- | --- |
| `t3jq-9nkf` | Created September 2025 | No history of its own. Snapshot it on every build from now on |
| Green Book CSV on the Wayback Machine | 9 captures, 2020 to 2025 | Year-by-year officials and divisions |
| Payroll agency codes | FY2014 to FY2025 | Births, deaths and renames by code |
| Printed Green Books on archive.org | 1993–94 and 1994–95 editions found | Scans. Likely more on HathiTrust. Needs OCR |
| Wikipedia list of former agencies | Varies | Already named in the brief |
