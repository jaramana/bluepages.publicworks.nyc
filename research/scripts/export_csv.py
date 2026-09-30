"""Write docs/downloads/bluepages-listings.csv from the published data files.

    python3 research/scripts/export_csv.py

One row for each of the 307 listings, joined with its payroll count and its
Green Book record where the join found one. Run it after join_sources.py
changes the data files.
"""

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "docs" / "data"
OUT = ROOT / "docs" / "downloads" / "bluepages-listings.csv"


def load(filename, name):
    text = (DATA / filename).read_text(encoding="utf-8")
    body = text[text.index("=", text.index("window." + name)) + 1:].strip().rstrip(";")
    return json.loads(body)


agencies = load("agencies.js", "AGENCIES")
payroll = load("payroll.js", "PAYROLL")
greenbook = load("greenbook.js", "GREENBOOK")

COLUMNS = [
    "id", "name", "acronym", "type", "website", "head", "head_title",
    "reports_to", "also_known_as", "green_book_officials",
    "payroll_year", "payroll_staff",
]

OUT.parent.mkdir(parents=True, exist_ok=True)
with OUT.open("w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(COLUMNS)
    for a in agencies:
        p = payroll.get(a["id"])
        year = p["latest"] if p else None
        staff = None
        if p:
            staff = next((n for y, n in p["headcount"] if y == year), None)
        g = greenbook.get(a["id"])
        w.writerow([
            a["id"], a["name"], a["acronym"] or "", a["type"], a["url"] or "",
            a["head"] or "", a["headTitle"] or "", a["reportsTo"] or "",
            a["aka"] or "",
            len(g["officials"]) if g else "",
            year if year else "", staff if staff is not None else "",
        ])

print(f"Wrote {len(agencies)} rows to {OUT.relative_to(ROOT)}")
