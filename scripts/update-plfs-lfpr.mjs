import { readFileSync, writeFileSync } from "fs";

const API_FILE =
  "C:\\Users\\Chintan\\.claude\\projects\\C--Users-Chintan-Documents-project-India\\3ea051c0-c03b-4532-b223-5a0005f6b2e2\\tool-results\\mcp-be345d6d-3109-4f5f-9599-6a42bdc84336-4_get_data-1772720876823.txt";
const PLFS_FILE =
  "C:\\Users\\Chintan\\Documents\\project_india\\india-data-dashboard\\public\\data\\mospi\\plfs-state.json";

const NAME_MAP = {
  "Andaman & Nicobar Islands": "Andaman & Nicobar",
  "Dadra & Nagar Haveli & Daman & Diu": "Dadra and Nagar Haveli and Daman and Diu",
  "Dadra & Nagar Haveli": "Dadra and Nagar Haveli and Daman and Diu",
  "Daman & Diu": "Dadra and Nagar Haveli and Daman and Diu",
};
const mapName = (n) => NAME_MAP[n] ?? n;

// ── 1. Parse API data ──────────────────────────────────────────────────────────
const apiRaw = readFileSync(API_FILE, "utf8");
const apiJson = JSON.parse(apiRaw);
console.log("API total records:", apiJson.meta_data.totalRecords);

// Filter: annual aggregate rows only (quarter=="all"), exclude All India
const rows = apiJson.data.filter(
  (r) => r.quarter === "all" && r.state !== "All India"
);
console.log("Filtered rows (quarter=all, non-All-India):", rows.length);
const genders = [...new Set(rows.map((r) => r.gender))].sort();
const years   = [...new Set(rows.map((r) => r.year))].sort();
console.log("Genders found:", genders);
console.log("Years found:", years);

// ── 2. Build lookup: stateName → year → gender → value ────────────────────────
const lookup = {};
for (const r of rows) {
  const g = r.gender; // "male" or "person"
  const val = r.value !== null && r.value !== "" ? Number(r.value) : null;
  if (!lookup[r.state]) lookup[r.state] = {};
  if (!lookup[r.state][r.year]) lookup[r.state][r.year] = {};
  lookup[r.state][r.year][g] = val;
}

// ── 3. Load existing plfs-state.json ─────────────────────────────────────────
const plfs = JSON.parse(readFileSync(PLFS_FILE, "utf8"));
const plfsYears = plfs.years; // ["2017-18", ..., "2023-24"]

// ── 4. Merge: add lfpr_male and lfpr_person to each state ────────────────────
let matched = 0;
for (const state of plfs.states) {
  // Find the API key that maps to this state's geoName (or stateName)
  const apiKey = Object.keys(lookup).find(
    (k) => mapName(k) === state.geoName || k === state.stateName
  );

  const maleArr   = [];
  const personArr = [];

  for (const yr of plfsYears) {
    const yearData = apiKey ? (lookup[apiKey]?.[yr] ?? {}) : {};
    maleArr.push(yearData["male"]   ?? null);
    personArr.push(yearData["person"] ?? null);
  }

  state.lfpr_male   = maleArr;
  state.lfpr_person = personArr;

  const hasData = maleArr.some((v) => v !== null);
  if (hasData) matched++;
  console.log(
    `${state.stateName}: male=${JSON.stringify(maleArr)}, person=${JSON.stringify(personArr)}`
  );
}

console.log(`\nMatched ${matched} of ${plfs.states.length} states with data`);

// ── 5. Write back ──────────────────────────────────────────────────────────────
writeFileSync(PLFS_FILE, JSON.stringify(plfs, null, 2), "utf8");
console.log("Written:", PLFS_FILE);
