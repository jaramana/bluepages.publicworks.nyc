# Roadmap: think big, build small

2026-09-25. Ideas first, then the filter that brings them back down.

## The foundation

- One crosswalk table: listing id to every other source's name or code for the same body.
- Every new dataset becomes one more column in that table, plus one fetch script.
- Rows today: agency list id, Green Book name, payroll codes. Next columns: OMB agency number, Checkbook agency code.
- This table is the project's core asset. The site is a view of it.

## Filter for any new dataset

| Test | Why |
| --- | --- |
| Published by the City on Open Data or a City API | Fidelity, one-command refresh |
| Joins through the crosswalk with a code, not fuzzy names | Integrity |
| Covers most core agencies | Avoids pages full of empty sections |
| Updates yearly or less, or refreshes itself | Low maintenance |
| One plain number or list per listing tells a story | Simplicity |

## Ideas, wild to plain

| Idea | Source | Passes filter? |
| --- | --- | --- |
| Adopted budget and budgeted positions per agency | OMB Expense Budget `mwzb-yiwb`, FY2017 to FY2027 | Yes. Strongest next step |
| Vacancy gap: budgeted positions vs. people on payroll | Budget plus payroll | Yes, once budget lands. Needs care on definitions |
| History: the org chart year by year | Green Book on the Wayback Machine, payroll codes, our own snapshots | Partly. Start snapshotting now |
| Legal basis: the Charter chapter or Local Law that creates each body | NYC Charter, hand-curated | Yes. Rarely changes. Manual but small |
| Contracts and spending per agency | Checkbook NYC | Maybe. Large, needs its own crosswalk |
| Performance indicators | Mayor's Management Report | Maybe. Indicators change yearly |
| Open jobs per agency | NYC Jobs | No for now. Central portal misses DOE, CUNY, DAs, Council |
| 311 complaints routed to each agency | 311 Service Requests | No. Huge, noisy, a different product |

## Verified facts behind the top idea

- `mwzb-yiwb` has 141 agency names for FY2027 and three publications (February, May, June 2026).
- Summing the June 2026 publication gives the Police Department $6.28 billion adopted and 48,850 budgeted positions.
- It includes non-agency lines (Miscellaneous, Pension Contributions, Debt Service). The crosswalk must leave those out.

## Lessons from databook.nyc

- Keep: type badge, "Reports to" with a chart link, one page per body.
- Avoid: many tabs that load empty, raw dataset names ("Expense Financial Plan - Exec"), budget jargon (PS, OTPS) without translation.
- A dash on a short fixed template orients the reader. Dozens of empty sections do the opposite. Add a section only when most listings can fill it.
