// scripts/generate-asi-state.mjs
// Reads the cached eSankhyiki API response and generates public/data/industry/asi-state.json

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load raw API data ──────────────────────────────────────────────────────────

const RAW_PATH = String.raw`C:\Users\Chintan\.claude\projects\C--Users-Chintan-Documents-project-India\3ea051c0-c03b-4532-b223-5a0005f6b2e2\tool-results\mcp-be345d6d-3109-4f5f-9599-6a42bdc84336-get_data-1775127905095.txt`;
const raw = JSON.parse(readFileSync(RAW_PATH, "utf8"));

// ── Constants ─────────────────────────────────────────────────────────────────

const YEARS = ["2015-16","2016-17","2017-18","2018-19","2019-20","2020-21","2021-22","2022-23","2023-24"];

const IND_MAP = {
  "Factories in Operation":                              "factories_in_op",
  "Fixed Capital":                                       "fixed_capital_lakh",
  "Gross Value Added":                                   "gva_lakh",
  "Total Number of Persons Engaged":                     "persons_engaged",
  "No. of Directly Employed Female Workers":             "female_workers",
  "Wages and Salaries Including Employer's Contribution":"wages_lakh",
};

// ── Build lookup: Map<`${state}||${year}||${field}`, number|null> ─────────────

const lookup = new Map();
for (const r of raw.data) {
  if (r.state === "All India") continue;
  const field = IND_MAP[r.indicator];
  if (!field) continue;
  const v = r.value && r.value !== "NA" ? parseInt(r.value.replace(/,/g, ""), 10) : null;
  lookup.set(`${r.state}||${r.year}||${field}`, v);
}

function getVal(apiNames, year, field) {
  if (!apiNames.length) return null;
  let total = null;
  for (const sn of apiNames) {
    const v = lookup.get(`${sn}||${year}||${field}`);
    if (v != null) total = (total ?? 0) + v;
  }
  return total;
}

// ── State definitions ─────────────────────────────────────────────────────────

const STATES = [
  { stateName: "Andaman & Nicobar Islands", geoName: "Andaman & Nicobar",    api: () => ["Andaman & Nicobar Islands"] },
  { stateName: "Andhra Pradesh",            geoName: "Andhra Pradesh",        api: () => ["Andhra Pradesh"] },
  { stateName: "Arunachal Pradesh",         geoName: "Arunachal Pradesh",     api: () => ["Arunachal Pradesh"] },
  { stateName: "Assam",                     geoName: "Assam",                 api: () => ["Assam"] },
  { stateName: "Bihar",                     geoName: "Bihar",                 api: () => ["Bihar"] },
  { stateName: "Chandigarh",                geoName: "Chandigarh",            api: () => ["Chandigarh"] },
  { stateName: "Chhattisgarh",              geoName: "Chhattisgarh",          api: () => ["Chattisgarh"] },
  {
    stateName: "Dadra and Nagar Haveli and Daman and Diu",
    geoName:   "Dadra and Nagar Haveli and Daman and Diu",
    api: (y) => y >= "2020-21" ? ["Dadra & Nagar Havelli and Daman & Diu"]
                               : ["Dadra & Nagar Haveli", "Daman & Diu"],
  },
  { stateName: "Delhi",                     geoName: "Delhi",                 api: () => ["Delhi"] },
  { stateName: "Goa",                       geoName: "Goa",                   api: () => ["Goa"] },
  { stateName: "Gujarat",                   geoName: "Gujarat",               api: () => ["Gujarat"] },
  { stateName: "Haryana",                   geoName: "Haryana",               api: () => ["Haryana"] },
  { stateName: "Himachal Pradesh",          geoName: "Himachal Pradesh",      api: () => ["Himachal Pradesh"] },
  { stateName: "Jammu & Kashmir",           geoName: "Jammu & Kashmir",       api: () => ["Jammu & Kashmir"] },
  { stateName: "Jharkhand",                 geoName: "Jharkhand",             api: () => ["Jharkhand"] },
  { stateName: "Karnataka",                 geoName: "Karnataka",             api: () => ["Karnataka"] },
  { stateName: "Kerala",                    geoName: "Kerala",                api: () => ["Kerala"] },
  { stateName: "Ladakh",                    geoName: "Ladakh",                api: (y) => y >= "2019-20" ? ["Ladakh"] : [] },
  { stateName: "Lakshadweep",               geoName: "Lakshadweep",           api: () => ["Lakshadweep"] },
  { stateName: "Madhya Pradesh",            geoName: "Madhya Pradesh",        api: () => ["Madhya Pradesh"] },
  { stateName: "Maharashtra",               geoName: "Maharashtra",           api: () => ["Maharashtra"] },
  { stateName: "Manipur",                   geoName: "Manipur",               api: () => ["Manipur"] },
  { stateName: "Meghalaya",                 geoName: "Meghalaya",             api: () => ["Meghalaya"] },
  { stateName: "Mizoram",                   geoName: "Mizoram",               api: () => ["Mizoram"] },
  { stateName: "Nagaland",                  geoName: "Nagaland",              api: () => ["Nagaland"] },
  { stateName: "Odisha",                    geoName: "Odisha",                api: () => ["Odisha"] },
  { stateName: "Puducherry",                geoName: "Puducherry",            api: () => ["Puducherry"] },
  { stateName: "Punjab",                    geoName: "Punjab",                api: () => ["Punjab"] },
  { stateName: "Rajasthan",                 geoName: "Rajasthan",             api: () => ["Rajasthan"] },
  { stateName: "Sikkim",                    geoName: "Sikkim",                api: () => ["Sikkim"] },
  { stateName: "Tamil Nadu",                geoName: "Tamil Nadu",            api: () => ["Tamil Nadu"] },
  { stateName: "Telangana",                 geoName: "Telangana",             api: () => ["Telangana"] },
  { stateName: "Tripura",                   geoName: "Tripura",               api: () => ["Tripura"] },
  { stateName: "Uttar Pradesh",             geoName: "Uttar Pradesh",         api: () => ["Uttar Pradesh"] },
  { stateName: "Uttarakhand",               geoName: "Uttarakhand",           api: () => ["Uttarakhand"] },
  { stateName: "West Bengal",               geoName: "West Bengal",           api: () => ["West Bengal"] },
];

const FIELDS = ["factories_in_op","fixed_capital_lakh","gva_lakh","persons_engaged","female_workers","wages_lakh"];

// ── Build output ───────────────────────────────────────────────────────────────

const states = STATES.map((s) => {
  const entry = { stateName: s.stateName, geoName: s.geoName };
  const arrays = Object.fromEntries(FIELDS.map((f) => [f, []]));
  const femalePct = [];

  for (const y of YEARS) {
    const apiNames = s.api(y);
    for (const f of FIELDS) {
      arrays[f].push(getVal(apiNames, y, f));
    }
    // Derived: female worker share %
    const fw = arrays.female_workers.at(-1);
    const pe = arrays.persons_engaged.at(-1);
    femalePct.push(fw != null && pe != null && pe > 0
      ? Math.round((fw / pe) * 1000) / 10
      : null);
  }

  for (const f of FIELDS) entry[f] = arrays[f];
  entry.female_workers_pct = femalePct;
  return entry;
});

const output = {
  source: "MoSPI, Annual Survey of Industries",
  sourceUrl: "https://mospi.gov.in/annual-survey-industries",
  lastUpdated: "2025-04-01",
  notes: "NIC 2008 classification. Combined (Rural+Urban) sector. All industries aggregated. Financial values in ₹ lakhs. Dadra & NH + Daman & Diu summed pre-2020-21; merged entity used from 2020-21 onwards. Ladakh null before 2019-20 (UT carved out Aug 2019).",
  years: YEARS,
  states,
};

// ── Write output ───────────────────────────────────────────────────────────────

const outDir = join(__dirname, "..", "public", "data", "industry");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "asi-state.json");
writeFileSync(outPath, JSON.stringify(output));

console.log(`Written ${states.length} states × ${YEARS.length} years → ${outPath}`);

// Quick sanity check
const mh = states.find((s) => s.stateName === "Maharashtra");
const idx = YEARS.indexOf("2022-23");
console.log("\nSanity check — Maharashtra 2022-23:");
console.log("  factories_in_op:   ", mh.factories_in_op[idx]);
console.log("  gva_lakh:          ", mh.gva_lakh[idx]);
console.log("  persons_engaged:   ", mh.persons_engaged[idx]);
console.log("  female_workers_pct:", mh.female_workers_pct[idx], "%");
console.log("  wages_lakh:        ", mh.wages_lakh[idx]);
