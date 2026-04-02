"""
generate-rbi-banking-state.py

Reads RBI Handbook of Statistics on Indian States 2024-25 Excel files:
  152T_branches.XLSX  — State-wise Offices of SCBs
  154T_cd_ratio.XLSX  — State-wise CD Ratio (Place of Utilisation)
  155T_deposits.XLSX  — State-wise Deposits by SCBs (₹ crore)
  156T_credit.XLSX    — State-wise Credit by SCBs (₹ crore)

Produces: public/data/rbi/banking-state.json
  Fields per state:
    branches        — SCB offices (count)
    cd_ratio        — Credit-Deposit ratio (%, Place of Utilisation)
    credit_cr       — Credit outstanding (₹ crore)
    deposits_cr     — Deposits outstanding (₹ crore)
    branch_density  — Branches per lakh population (derived)
    credit_pc_k     — Credit per capita (₹ thousand, derived)
    deposits_pc_k   — Deposits per capita (₹ thousand, derived)

Years: 2015-16 to 2023-24 (end-March 2016 to end-March 2024 in the Excel sheets)
"""

import openpyxl, json, os, sys, math

sys.stdout.reconfigure(encoding="utf-8")

BASE  = os.path.dirname(os.path.abspath(__file__))
RAW   = os.path.join(BASE, "rbi_raw")
OUT   = os.path.join(BASE, "..", "public", "data", "rbi", "banking-state.json")

# ── Target fiscal years ────────────────────────────────────────────────────────
# Sheet (ii) col headers: 2015 2016 2017 2018 2019 2020 2021 2022 2023 2024 2025
# FY 2015-16 = end-March 2016 = column index 1 (0-based from 2015)
# FY 2023-24 = end-March 2024 = column index 9
COL_YEARS   = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]
TARGET_COLS = list(range(1, 10))  # indices 1-9 → years 2016-2024
FY_LABELS   = [f"{y-1}-{str(y)[2:]}" for y in [COL_YEARS[i] for i in TARGET_COLS]]
# → ["2015-16", "2016-17", ..., "2023-24"]

# ── State population estimates (lakhs) 2016-2024 ──────────────────────────────
# Based on Census 2011 base + state-specific growth rates
# Format: [pop_2016, pop_2017, ..., pop_2024]  (9 values)
# Derived from Census 2011 populations with projected AAGR from 2001-2011 trends
def project_pop(base_2011: float, aagr: float) -> list:
    """Project population from 2011 base at AAGR to years 2016-2024."""
    return [round(base_2011 * ((1 + aagr) ** (yr - 2011)), 2)
            for yr in range(2016, 2025)]

POP = {
    # state name in Excel → [pop_2016 … pop_2024] in lakhs
    "Andaman & Nicobar Islands": project_pop(3.80,  0.011),
    "Andhra Pradesh":            project_pop(494.0, 0.009),
    "Arunachal Pradesh":         project_pop(13.84, 0.016),
    "Assam":                     project_pop(312.1, 0.015),
    "Bihar":                     project_pop(1041.0,0.019),
    "Chandigarh":                project_pop(10.55, 0.017),
    "Chhattisgarh":              project_pop(255.5, 0.018),
    # Dadra & NH + Daman & Diu combined throughout (merged Jan 2020)
    "Dadra & Nagar Haveli*":     project_pop(5.86,  0.030),
    "Delhi":                     project_pop(167.9, 0.019),
    "Goa":                       project_pop(14.58, 0.009),
    "Gujarat":                   project_pop(604.4, 0.019),
    "Haryana":                   project_pop(253.5, 0.019),
    "Himachal Pradesh":          project_pop(68.65, 0.009),
    "Jammu & Kashmir":           project_pop(122.5, 0.019),
    "Ladakh":                    project_pop(2.74,  0.010),
    "Jharkhand":                 project_pop(329.9, 0.018),
    "Karnataka":                 project_pop(611.0, 0.017),
    "Kerala":                    project_pop(334.1, 0.005),
    "Lakshadweep":               project_pop(0.64,  0.006),
    "Madhya Pradesh":            project_pop(726.3, 0.020),
    "Maharashtra":               project_pop(1123.7,0.016),
    "Manipur":                   project_pop(27.22, 0.013),
    "Meghalaya":                 project_pop(29.67, 0.018),
    "Mizoram":                   project_pop(10.97, 0.022),
    "Nagaland":                  project_pop(19.79, 0.005),
    "Odisha":                    project_pop(419.7, 0.014),
    "Puducherry":                project_pop(12.47, 0.014),
    "Punjab":                    project_pop(277.4, 0.013),
    "Rajasthan":                 project_pop(685.5, 0.020),
    "Sikkim":                    project_pop(6.11,  0.012),
    "Tamil Nadu":                project_pop(721.5, 0.009),
    "Telangana":                 project_pop(350.0, 0.014),
    "Tripura":                   project_pop(36.74, 0.015),
    "Uttar Pradesh":             project_pop(1998.1,0.018),
    "Uttarakhand":               project_pop(100.9, 0.017),
    "West Bengal":               project_pop(912.8, 0.013),
}

# ── GeoJSON name mapping ───────────────────────────────────────────────────────
GEO_MAP = {
    "Andaman & Nicobar Islands": "Andaman & Nicobar",
    "Andhra Pradesh":            "Andhra Pradesh",
    "Arunachal Pradesh":         "Arunachal Pradesh",
    "Assam":                     "Assam",
    "Bihar":                     "Bihar",
    "Chandigarh":                "Chandigarh",
    "Chhattisgarh":              "Chhattisgarh",
    "Dadra & Nagar Haveli*":     "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi":                     "Delhi",
    "Goa":                       "Goa",
    "Gujarat":                   "Gujarat",
    "Haryana":                   "Haryana",
    "Himachal Pradesh":          "Himachal Pradesh",
    "Jammu & Kashmir":           "Jammu & Kashmir",
    "Ladakh":                    "Ladakh",
    "Jharkhand":                 "Jharkhand",
    "Karnataka":                 "Karnataka",
    "Kerala":                    "Kerala",
    "Lakshadweep":               "Lakshadweep",
    "Madhya Pradesh":            "Madhya Pradesh",
    "Maharashtra":               "Maharashtra",
    "Manipur":                   "Manipur",
    "Meghalaya":                 "Meghalaya",
    "Mizoram":                   "Mizoram",
    "Nagaland":                  "Nagaland",
    "Odisha":                    "Odisha",
    "Puducherry":                "Puducherry",
    "Punjab":                    "Punjab",
    "Rajasthan":                 "Rajasthan",
    "Sikkim":                    "Sikkim",
    "Tamil Nadu":                "Tamil Nadu",
    "Telangana":                 "Telangana",
    "Tripura":                   "Tripura",
    "Uttar Pradesh":             "Uttar Pradesh",
    "Uttarakhand":               "Uttarakhand",
    "West Bengal":               "West Bengal",
}

# Regional subtotal names to skip
REGIONS = {
    "NORTHERN REGION", "NORTH-EASTERN REGION", "EASTERN REGION",
    "CENTRAL REGION", "WESTERN REGION", "SOUTHERN REGION", "ALL INDIA",
}

# ── Excel reader ───────────────────────────────────────────────────────────────

def read_sheet(filepath: str, sheet_name: str) -> dict:
    """Read sheet → {state_name: [val_2016, ..., val_2024]} (9 values)."""
    wb  = openpyxl.load_workbook(filepath, data_only=True)
    ws  = wb[sheet_name]
    rows = list(ws.iter_rows(values_only=True))

    # Row 4 (index 3) = header: [None, 'Region/State...', 2015, 2016, ..., 2025]
    # Data rows start at index 4
    result = {}
    for row in rows[4:]:
        name = row[1]
        if name is None:
            continue
        name = str(name).strip().rstrip("*").rstrip()
        # Re-add asterisk for the merged Dadra UT name lookup
        raw_name = str(row[1]).strip()

        if name in REGIONS or name.startswith("Source") or name.startswith("-"):
            continue
        if name.startswith("*") or name.startswith("Note"):
            continue

        vals = []
        for idx in TARGET_COLS:
            v = row[idx + 1]  # +1 because col 0 = None, col 1 = state name
            if v is None or v == "-" or str(v).strip() == "-":
                vals.append(None)
            else:
                try:
                    vals.append(float(v))
                except (ValueError, TypeError):
                    vals.append(None)

        result[raw_name] = vals
    return result


# ── Read all four tables ───────────────────────────────────────────────────────
print("Reading Excel files...")

branches_raw = read_sheet(os.path.join(RAW, "152T_branches.XLSX"), "T_152(ii)")
cd_raw       = read_sheet(os.path.join(RAW, "154T_cd_ratio.XLSX"), "T_154(ii)")
deposits_raw = read_sheet(os.path.join(RAW, "155T_deposits.XLSX"), "T_155(ii)")
credit_raw   = read_sheet(os.path.join(RAW, "156T_credit.XLSX"),   "T_156(ii)")

# Print available keys to debug
print("Branches keys:", sorted(branches_raw.keys()))
print()

# ── Handle merged Dadra UT ─────────────────────────────────────────────────────
# Pre-2020: "Dadra & Nagar Haveli" (no asterisk) + "Daman & Diu" separate
# From 2020: "Dadra & Nagar Haveli*" includes both
# In our TARGET_COLS 2016-2024: indices 0-4 = 2016-2020, 5-8 = 2021-2024
# Actually: idx 0=2016, 1=2017, 2=2018, 3=2019, 4=2020, 5=2021, 6=2022, 7=2023, 8=2024
# The merger was Jan 2020, and BSR data is end-March so March 2020 already merged → col 4 (2020) is merged

def merge_dadra(raw: dict, field: str = "sum") -> list:
    """Build 9-value array for combined Dadra & NH + Daman & Diu."""
    dnh = raw.get("Dadra & Nagar Haveli") or raw.get("Dadra & Nagar Haveli*", [None]*9)
    diu = raw.get("Daman & Diu", [None]*9)
    merged_key = "Dadra & Nagar Haveli*"
    merged = raw.get(merged_key, [None]*9)

    result = []
    for i in range(9):
        yr = TARGET_COLS[i]  # 1=2016 … 9=2024
        col_year = COL_YEARS[yr]
        if col_year >= 2020:
            # Use merged entry
            v = merged[i] if merged else None
            result.append(v)
        else:
            # Sum or weighted average of the two separate UTs
            v1 = (dnh[i] if dnh else None)
            v2 = (diu[i] if diu else None)
            if field == "sum":
                result.append(
                    (v1 or 0) + (v2 or 0) if (v1 is not None or v2 is not None) else None
                )
            elif field == "avg":
                # For CD ratio: weight by deposits if available, else simple avg
                result.append(
                    ((v1 or 0) + (v2 or 0)) / 2
                    if (v1 is not None and v2 is not None)
                    else (v1 or v2)
                )
    return result


# ── Build state entries ────────────────────────────────────────────────────────
print("Building state entries...")

TARGET_STATES = list(GEO_MAP.keys())

states_out = []
missing_states = []

for excel_name, geo_name in GEO_MAP.items():
    clean = excel_name.rstrip("*").strip()

    # Get raw arrays (handle Dadra merge)
    if clean == "Dadra & Nagar Haveli":
        br  = merge_dadra(branches_raw, "sum")
        cd  = merge_dadra(cd_raw, "avg")
        dep = merge_dadra(deposits_raw, "sum")
        crd = merge_dadra(credit_raw, "sum")
    else:
        # Try exact name, then with asterisk
        br  = branches_raw.get(excel_name) or branches_raw.get(clean)
        cd  = cd_raw.get(excel_name) or cd_raw.get(clean)
        dep = deposits_raw.get(excel_name) or deposits_raw.get(clean)
        crd = credit_raw.get(excel_name) or credit_raw.get(clean)

    if br is None and cd is None and dep is None and crd is None:
        missing_states.append(excel_name)
        continue

    pop = POP.get(excel_name) or POP.get(clean)

    # Derived: branch density (per lakh pop)
    branch_density = []
    for i, b in enumerate(br or [None]*9):
        p = pop[i] if pop else None
        if b is not None and p is not None and p > 0:
            branch_density.append(round(b / p, 2))
        else:
            branch_density.append(None)

    # Derived: credit per capita (₹ thousand)  — deposits in ₹ crore
    # ₹ crore / lakh people = ₹ crore / lakh = ₹ 1000/person (1 crore = 100 lakh → 100 lakh / 1 lakh = 100 per person → ×10000/pop_lakh * 100 = ... )
    # credit_cr (₹ crore) / pop_lakh (lakh persons) =
    #   (credit_cr * 10000) / (pop_lakh * 100000) = credit_cr * 10000 / (pop_lakh * 1e5)
    #   = credit_cr / (pop_lakh * 10)
    # = ₹ thousand per person  ✓
    def per_capita_k(arr, pop_arr):
        result = []
        for i, v in enumerate(arr or [None]*9):
            p = pop_arr[i] if pop_arr else None
            if v is not None and p is not None and p > 0:
                result.append(round(v / (p * 10), 1))
            else:
                result.append(None)
        return result

    credit_pc  = per_capita_k(crd, pop)
    deposits_pc = per_capita_k(dep, pop)

    # Round raw values
    def round_arr(arr, dp=0):
        if arr is None: return [None]*9
        return [round(v, dp) if v is not None else None for v in arr]

    states_out.append({
        "stateName":       excel_name.rstrip("*").strip() if "Dadra" not in excel_name else "Dadra and Nagar Haveli and Daman and Diu",
        "geoName":         geo_name,
        "branches":        round_arr(br),
        "cd_ratio":        round_arr(cd, 1),
        "credit_cr":       round_arr(crd),
        "deposits_cr":     round_arr(dep),
        "branch_density":  branch_density,
        "credit_pc_k":     credit_pc,
        "deposits_pc_k":   deposits_pc,
    })

if missing_states:
    print(f"WARNING — not found in Excel: {missing_states}")

# ── Output ─────────────────────────────────────────────────────────────────────
output = {
    "source":      "RBI Handbook of Statistics on Indian States 2024-25",
    "sourceUrl":   "https://www.rbi.org.in/scripts/AnnualPublications.aspx?head=Handbook+of+Statistics+on+Indian+States",
    "lastUpdated": "2025-12-11",
    "notes":       "Tables 152, 154, 155, 156. Data as at end-March each year. CD ratio is Place of Utilisation basis. Dadra & NH and Daman & Diu are reported separately until March 2019; combined from March 2020 after merger. Ladakh data available from March 2020 (UT carved out August 2019). Branch density and per-capita figures use Census 2011 based state population projections.",
    "years":       FY_LABELS,
    "states":      states_out,
}

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(output, f, separators=(",", ":"), ensure_ascii=False)

print(f"\nWritten {len(states_out)} states × {len(FY_LABELS)} years → {OUT}")
print(f"Years: {FY_LABELS}")

# Sanity check
mh = next((s for s in states_out if s["stateName"] == "Maharashtra"), None)
if mh:
    idx = FY_LABELS.index("2022-23")
    print(f"\nSanity — Maharashtra 2022-23:")
    print(f"  branches:       {mh['branches'][idx]:,}")
    print(f"  cd_ratio:       {mh['cd_ratio'][idx]}%")
    print(f"  credit_cr:      ₹{mh['credit_cr'][idx]:,} cr")
    print(f"  branch_density: {mh['branch_density'][idx]} per lakh pop")
    print(f"  credit_pc_k:    ₹{mh['credit_pc_k'][idx]}k per person")

dl = next((s for s in states_out if s["stateName"] == "Delhi"), None)
if dl:
    idx = FY_LABELS.index("2022-23")
    print(f"\nSanity — Delhi 2022-23:")
    print(f"  cd_ratio:   {dl['cd_ratio'][idx]}%  (expect ~140+)")
    print(f"  credit_pc_k: ₹{dl['credit_pc_k'][idx]}k  (expect very high)")
