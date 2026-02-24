/**
 * Temporary helper script — extracts GVA sector data from the cached MoSPI
 * API response and writes gva-raw.json to the project root for inspection.
 *
 * Run once:  node scripts/extract-gva-raw.mjs
 * Delete afterwards — not needed in production.
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { homedir } from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Path to the cached MoSPI API response (written by the MoSPI MCP tool)
const CACHE_FILE = join(
  homedir(),
  ".claude",
  "projects",
  "C--Users-Chintan-Documents-project-India",
  "3ea051c0-c03b-4532-b223-5a0005f6b2e2",
  "tool-results",
  "mcp-be345d6d-3109-4f5f-9599-6a42bdc84336-4_get_data-1771936364741.txt"
);

const raw = readFileSync(CACHE_FILE, "utf8");
const json = JSON.parse(raw);

// Group by sector
const sectors = {};
for (const row of json.data) {
  const key = row.industry;
  if (!sectors[key]) sectors[key] = [];
  sectors[key].push({
    year: row.year,
    quarter: row.quarter,
    real: row.constant_price === null ? null : parseFloat(row.constant_price),
    nominal: row.current_price === null ? null : parseFloat(row.current_price),
  });
}

// Sort each sector chronologically (oldest first)
const QUARTER_ORDER = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };
for (const key of Object.keys(sectors)) {
  sectors[key].sort((a, b) => {
    if (a.year !== b.year) return a.year < b.year ? -1 : 1;
    return QUARTER_ORDER[a.quarter] - QUARTER_ORDER[b.quarter];
  });
}

const outPath = join(__dirname, "..", "gva-raw.json");
writeFileSync(outPath, JSON.stringify(sectors, null, 2));

console.log("✅  Written to gva-raw.json");
console.log("Sectors found:", Object.keys(sectors));
console.log(
  "Records per sector:",
  Object.fromEntries(Object.entries(sectors).map(([k, v]) => [k, v.length]))
);
