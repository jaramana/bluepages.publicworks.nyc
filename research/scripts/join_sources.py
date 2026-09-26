"""Join the Green Book and paygap payroll outputs to the agency list.

Prototype only. The pipeline replaces this with 01_fetch and 02_normalize
plus two hand-kept crosswalk CSVs.

Run from the project root:
    python3 research/scripts/join_sources.py

Inputs
    docs/data/agencies.js                     agency list (t3jq-9nkf snapshot)
    Green Book (mdcw-n682)                    fetched from the Open Data API
    ../paygap.publicworks.nyc/docs/downloads  headcount and wage CSVs

Outputs
    docs/data/greenbook.js                    window.GREENBOOK, keyed by entry id
    docs/data/payroll.js                      window.PAYROLL, keyed by entry id
    research/crosswalk-report.md              what matched and what did not
"""

import csv
import json
import re
import urllib.request
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PAYGAP = ROOT.parent / "paygap.publicworks.nyc" / "docs" / "downloads"
GREENBOOK_URL = "https://data.cityofnewyork.us/resource/mdcw-n682.json?$limit=10000"

# Officials shown per entry. The rest stay in the source.
OFFICIALS_MAX = 40


# ---- Manual crosswalks ------------------------------------------------------
# Green Book agency_name -> entry id. Auto-matching handles the rest.

GREENBOOK_MANUAL = {
    "Comptroller": "office-of-the-new-york-city-comptroller",
    "Consumer and Worker Protection": "department-of-consumer-and-worker-protection",
    "Human Resources Administration / Department of Social Services": "department-of-social-services",
    "Parks, NYC": "department-of-parks-and-recreation",
    "Public Advocate for the City of New York": "office-of-the-public-advocate",
    "Records & Information Services": "department-of-records-and-information-services",
    "Teachers' Retirement System": "teachers-retirement-system-of-city-of-new-york",
    "Police Pension Fund": "new-york-city-police-pension-fund",
    "NYC Fire Pension Fund": "fire-department-pension-fund-and-related-funds",
    "Education": "new-york-city-public-schools",
    "Civil Service Commission, City": "civil-service-commission",
    "City Clerk & Clerk of the Council": "office-of-the-city-clerk",
    "Health + Hospitals NYC, (NYC H+H)": "nyc-health-hospitals",
    "Health + Hospitals / Board of Directors, NYC": "nyc-health-hospitals",
    "Water Finance Authority, NYC Municipal": "new-york-city-municipal-water-finance-authority",
    "New York City Tourism (previously NYC & Company)": "new-york-city-tourism-conventions",
    "Investigation for the NYC School District, Special Commissioner of": "special-commissioner-of-investigation-for-the-new-york-city-school-district",
    "Office Of Special Narcotics": "office-of-the-special-narcotics-prosecutor",
    "Borough President - Bronx": "office-of-the-borough-president-of-the-bronx",
    "Borough President - Brooklyn": "office-of-the-borough-president-of-brooklyn",
    "Borough President - Manhattan": "office-of-the-borough-president-of-manhattan",
    "Borough President - Queens": "office-of-the-borough-president-of-queens",
    "Borough President - Staten Island": "office-of-the-borough-president-of-staten-island",
}

# The Green Book lists all five DAs under one name. Split by office city.
DA_BY_CITY = {
    "Bronx": "bronx-district-attorney-s-office",
    "Brooklyn": "brooklyn-district-attorney-s-office",
    "New York": "manhattan-district-attorney-s-office",
    "Kew Gardens": "queens-district-attorney-s-office",
    "Staten Island": "staten-island-district-attorney-s-office",
}

# Payroll agency code -> entry id. Several codes can feed one entry.
PAYROLL_MANUAL = {
    "ADMIN FOR CHILDREN'S SVCS": "administration-for-children-s-services",
    "ADMIN TRIALS AND HEARINGS": "office-of-administrative-trials-and-hearings",
    "DEPARTMENT FOR THE AGING": "department-for-the-aging",
    "DEPARTMENT OF BUILDINGS": "department-of-buildings",
    "DEPARTMENT OF BUSINESS SERV.": "department-of-small-business-services",
    "DEPARTMENT OF CITY PLANNING": "department-of-city-planning",
    "DEPARTMENT OF CORRECTION": "department-of-correction",
    "DEPARTMENT OF FINANCE": "department-of-finance",
    "DEPARTMENT OF INVESTIGATION": "department-of-investigation",
    "DEPARTMENT OF PROBATION": "department-of-probation",
    "DEPARTMENT OF SANITATION": "new-york-city-department-of-sanitation",
    "DEPARTMENT OF TRANSPORTATION": "new-york-city-department-of-transportation",
    "DEPT OF CITYWIDE ADMIN SVCS": "department-of-citywide-administrative-services",
    "DEPT OF ENVIRONMENT PROTECTION": "department-of-environmental-protection",
    "DEPT OF HEALTH/MENTAL HYGIENE": "department-of-health-and-mental-hygiene",
    "DEPT OF PARKS & RECREATION": "department-of-parks-and-recreation",
    "DEPT OF RECORDS & INFO SERVICE": "department-of-records-and-information-services",
    "DEPT OF YOUTH & COMM DEV SRVS": "department-of-youth-and-community-development",
    "DEPT. OF DESIGN & CONSTRUCTION": "department-of-design-and-construction",
    "DEPT. OF HOMELESS SERVICES": "department-of-homeless-services",
    "CONSUMER AFFAIRS": "department-of-consumer-and-worker-protection",
    "CONSUMER AND WORKER PROTECTION": "department-of-consumer-and-worker-protection",
    "CULTURAL AFFAIRS": "department-of-cultural-affairs",
    "FIRE DEPARTMENT": "fire-department-of-the-city-of-new-york",
    "HOUSING PRESERVATION & DVLPMNT": "department-of-housing-preservation-and-development",
    "HRA/DEPT OF SOCIAL SERVICES": "department-of-social-services",
    "LAW DEPARTMENT": "new-york-city-law-department",
    "NYC DEPT OF VETERANS' SERVICES": "department-of-veterans-services",
    "NYC EMPLOYEES RETIREMENT SYS": "new-york-city-employee-retirement-system",
    "NYC FIRE PENSION FUND": "fire-department-pension-fund-and-related-funds",
    "NYC POLICE PENSION FUND": "new-york-city-police-pension-fund",
    "TEACHERS RETIREMENT SYSTEM": "teachers-retirement-system-of-city-of-new-york",
    "OFF OF PAYROLL ADMINISTRATION": "office-of-payroll-administration",
    "OFFICE OF EMERGENCY MANAGEMENT": "new-york-city-emergency-management",
    "OFFICE OF THE COMPTROLLER": "office-of-the-new-york-city-comptroller",
    "OFFICE OF THE MAYOR": "office-of-the-mayor",
    "POLICE DEPARTMENT": "new-york-city-police-department",
    "PUBLIC ADVOCATE": "office-of-the-public-advocate",
    "TAXI & LIMOUSINE COMMISSION": "new-york-city-taxi-and-limousine-commission",
    "CITY COUNCIL": "new-york-city-council",
    "DEPT OF INFO TECH & TELECOMM": "office-of-technology-and-innovation",
    "TECHNOLOGY & INNOVATION": "office-of-technology-and-innovation",
    "BRONX DA": "bronx-district-attorney-s-office",
    "BRONX DISTRICT ATTORNEY": "bronx-district-attorney-s-office",
    "KINGS DA": "brooklyn-district-attorney-s-office",
    "DISTRICT ATTORNEY KINGS COUNTY": "brooklyn-district-attorney-s-office",
    "MANHATTAN DA": "manhattan-district-attorney-s-office",
    "DISTRICT ATTORNEY-MANHATTAN": "manhattan-district-attorney-s-office",
    "QUEENS DA": "queens-district-attorney-s-office",
    "DISTRICT ATTORNEY QNS COUNTY": "queens-district-attorney-s-office",
    "RICHMOND DA": "staten-island-district-attorney-s-office",
    "DISTRICT ATTORNEY RICHMOND COU": "staten-island-district-attorney-s-office",
    "BOROUGH PRESIDENT-BRONX": "office-of-the-borough-president-of-the-bronx",
    "BOROUGH PRESIDENT-BROOKLYN": "office-of-the-borough-president-of-brooklyn",
    "PRESIDENT BOROUGH OF MANHATTAN": "office-of-the-borough-president-of-manhattan",
    "BOROUGH PRESIDENT-QUEENS": "office-of-the-borough-president-of-queens",
    "BOROUGH PRESIDENT-STATEN IS": "office-of-the-borough-president-of-staten-island",
    "DEPARTMENT OF EDUCATION ADMIN": "new-york-city-public-schools",
    "DEPT OF ED PEDAGOGICAL": "new-york-city-public-schools",
    "DEPT OF ED PARA PROFESSIONALS": "new-york-city-public-schools",
    "DEPT OF ED HRLY SUPPORT STAFF": "new-york-city-public-schools",
    "DEPT OF ED PER DIEM TEACHERS": "new-york-city-public-schools",
    "DEPT OF ED PER SESSION TEACHER": "new-york-city-public-schools",
    "DOE CUSTODIAL PAYROL": "new-york-city-public-schools",
    "OFFICE OF MANAGEMENT & BUDGET": "mayor-s-office-of-management-and-budget",
    "OFFICE OF LABOR RELATIONS": "office-of-labor-relations",
    "OFFICE OF COLLECTIVE BARGAININ": "office-of-collective-bargaining",
    "LANDMARKS PRESERVATION COMM": "landmarks-preservation-commission",
    "CIVILIAN COMPLAINT REVIEW BD": "civilian-complaint-review-board",
    "HUMAN RIGHTS COMMISSION": "city-commission-on-human-rights",
    "EQUAL EMPLOY PRACTICES COMM": "equal-employment-practices-commission",
    "FINANCIAL INFO SVCS AGENCY": "financial-information-services-agency",
    "MAYORS OFFICE OF CONTRACT SVCS": "mayor-s-office-of-contract-services",
    "MUNICIPAL WATER FIN AUTHORITY": "new-york-city-municipal-water-finance-authority",
    "INDEPENDENT BUDGET OFFICE": "independent-budget-office",
    "BUSINESS INTEGRITY COMMISSION": "business-integrity-commission",
    "CAMPAIGN FINANCE BOARD": "campaign-finance-board",
    "CONFLICTS OF INTEREST BOARD": "conflicts-of-interest-board",
    "CIVIL SERVICE COMMISSION": "civil-service-commission",
    "BOARD OF CORRECTION": "board-of-correction",
    "BOARD OF ELECTION": "board-of-elections",
    "OFFICE OF CRIMINAL JUSTICE": "mayor-s-office-of-criminal-justice",
    "COMMISSION ON RACIAL EQUITY": "commission-on-racial-equity",
    "OFFICE OF RACIAL EQUITY": "mayor-s-office-of-equity-and-racial-justice",
    "OFFICE OF THE ACTUARY": "new-york-city-office-of-the-actuary",
    "TAX COMMISSION": "new-york-city-tax-commission",
    "CITY CLERK": "office-of-the-city-clerk",
    "SPEC NARCS-DA": "office-of-the-special-narcotics-prosecutor",
    "DISTRICT ATTORNEY-SPECIAL NARC": "office-of-the-special-narcotics-prosecutor",
    "PUBLIC ADMINISTRATOR-BRONX": "bronx-county-public-administrator",
    "PUBLIC ADMINISTRATOR-KINGS": "kings-county-public-administrator",
    "PUBLIC ADMINISTRATOR-NEW YORK": "new-york-county-public-administrator",
    "PUBLIC ADMINISTRATOR-QUEENS": "public-administrator-of-queens-county",
    "PUBLIC ADMINISTRATOR-RICHMOND": "richmond-county-public-administrator",
    "BOARD OF CORRECTIONS": "board-of-correction",
    "DISTRICTING COMMISSION": "new-york-city-districting-commission",
}


def norm(s):
    s = (s or "").lower().replace("&", "and").replace("+", "and")
    s = re.sub(r"\bnyc\b|\bnew york city\b|\bcity of new york\b|\bthe\b", "", s)
    return re.sub(r"[^a-z]", "", s)


def load_agencies():
    t = (ROOT / "docs/data/agencies.js").read_text()
    return json.loads(t[t.index("["): t.rindex("]") + 1])


def title_case_city(s):
    return (s or "").strip().title()


def main():
    A = load_agencies()
    ids = {a["id"] for a in A}
    index = {}
    for a in A:
        for k in (a["name"], a["alpha"], a.get("acronym")):
            if k and norm(k):
                index.setdefault(norm(k), a["id"])

    report = ["# Crosswalk report", "", "Generated by `research/scripts/join_sources.py`.", ""]

    # ---- Green Book ----------------------------------------------------------

    with urllib.request.urlopen(GREENBOOK_URL) as r:
        rows = json.load(r)

    def gb_id(r):
        name = r["agency_name"]
        if name == "District Attorney":
            return DA_BY_CITY.get(title_case_city(r.get("city")))
        if name in GREENBOOK_MANUAL:
            return GREENBOOK_MANUAL[name]
        return index.get(norm(name) or "-") or index.get(norm(r.get("agency_acronym")) or "-")

    gb = defaultdict(lambda: {"officials": [], "divisions": set()})
    gb_miss = defaultdict(int)
    for r in rows:
        eid = gb_id(r)
        if not eid or eid not in ids:
            gb_miss[r["agency_name"]] += 1
            continue
        e = gb[eid]
        e.setdefault("gbName", r["agency_name"])
        e.setdefault("section", r.get("section"))
        if r.get("address") and "address" not in e:
            e["address"] = ", ".join(x for x in (r.get("address"), title_case_city(r.get("city")), r.get("state"), r.get("zip_code")) if x)
        if r.get("agency_primary_phone") and "phone" not in e:
            e["phone"] = r["agency_primary_phone"]
        person = " ".join(x for x in (r.get("first_name"), r.get("m_i"), r.get("last_name"), r.get("name_suffix")) if x)
        path = [x for x in (r.get("grand_parent_division"), r.get("parent_division"), r.get("division_name")) if x]
        e["officials"].append({"name": person, "title": r.get("office_title"), "path": path})
        for i in range(len(path)):
            e["divisions"].add(" > ".join(path[: i + 1]))

    out = {}
    for eid, e in gb.items():
        e["count"] = len(e["officials"])
        e["divisions"] = sorted(e["divisions"])
        e["officials"] = e["officials"][:OFFICIALS_MAX]
        out[eid] = e
    (ROOT / "docs/data/greenbook.js").write_text(
        "// Green Book (NYC Open Data mdcw-n682), joined by research/scripts/join_sources.py.\n"
        "window.GREENBOOK = " + json.dumps(out, indent=0) + ";\n")

    report += [f"## Green Book", "",
               f"- Rows: {len(rows)}",
               f"- Entries matched: {len(out)} of {len(A)}",
               f"- Rows matched: {sum(e['count'] for e in out.values())}",
               f"- Green Book agencies with no entry: {len(gb_miss)}", ""]
    report += [f"  - {n} ({c} rows)" for n, c in sorted(gb_miss.items())]

    # ---- Payroll -------------------------------------------------------------

    head = list(csv.DictReader(open(PAYGAP / "headcount_by_agency.csv")))
    wages = {(r["agency"], r["fiscal_year"]): r for r in csv.DictReader(open(PAYGAP / "real_wages_by_agency.csv"))}

    def pay_id(code):
        return PAYROLL_MANUAL.get(code) or index.get(norm(code) or "-")

    pay = defaultdict(lambda: {"codes": set(), "years": defaultdict(int)})
    pay_miss = set()
    for r in head:
        eid = pay_id(r["agency"])
        if not eid or eid not in ids:
            pay_miss.add(r["agency"])
            continue
        pay[eid]["codes"].add(r["agency"])
        pay[eid]["years"][int(r["fiscal_year"])] += int(r["n"])

    # The Pay Gap has a lookup page for each agency code in its index. Small codes have none.
    paygap_slug = {r["agency"]: r["slug"] for r in json.load(open(PAYGAP.parent / "data" / "agencies-index.json"))}

    out = {}
    for eid, p in pay.items():
        codes = sorted(p["codes"])
        latest = max(p["years"])
        median = None
        if len(codes) == 1:
            w = wages.get((codes[0], str(latest)))
            if w and w["suppressed"] == "FALSE":
                median = round(float(w["median_salary"]))
        out[eid] = {"codes": codes, "latest": latest, "headcount": [[y, p["years"][y]] for y in sorted(p["years"])],
                    "medianSalary": median, "paygap": [[c, paygap_slug[c]] for c in codes if c in paygap_slug]}
    (ROOT / "docs/data/payroll.js").write_text(
        "// Citywide Payroll (k397-673e) via paygap.publicworks.nyc, joined by research/scripts/join_sources.py.\n"
        "window.PAYROLL = " + json.dumps(out, indent=0) + ";\n")

    unknown = sorted(v for v in PAYROLL_MANUAL.values() if v not in ids)
    report += ["", "## Payroll", "",
               f"- Payroll agency codes: {len({r['agency'] for r in head})}",
               f"- Entries matched: {len(out)} of {len(A)}",
               f"- Codes with no entry: {len(pay_miss)}", ""]
    report += [f"  - {c}" for c in sorted(pay_miss)]
    if unknown:
        report += ["", "Manual payroll targets that are not entry ids (fix the crosswalk):", ""]
        report += [f"  - {u}" for u in unknown]
    (ROOT / "research/crosswalk-report.md").write_text("\n".join(report) + "\n")
    print("\n".join(report[:14]))
    print("unknown manual targets:", unknown)


if __name__ == "__main__":
    main()
