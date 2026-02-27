/**
 * generate-cpi.mjs
 * Reads CPI tool-result files (pages 1-4, All India Combined),
 * processes 14 subgroups, and writes public/data/mospi/cpi-monthly.json
 *
 * Data coverage: March 2014 – December 2025 (142 months)
 * Source: MoSPI CPI API, base year 2012=100
 *
 * Run: node scripts/generate-cpi.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "..", "public", "data", "mospi");

// ─── Tool-result file paths (pages 1-4) ──────────────────────────────────

const TOOL_DIR =
  "C:/Users/Chintan/.claude/projects/" +
  "C--Users-Chintan-Documents-project-India/" +
  "3ea051c0-c03b-4532-b223-5a0005f6b2e2/tool-results";

const CPI_FILES = [
  `${TOOL_DIR}/mcp-be345d6d-3109-4f5f-9599-6a42bdc84336-4_get_data-1772125954827.txt`, // page 1
  `${TOOL_DIR}/mcp-be345d6d-3109-4f5f-9599-6a42bdc84336-4_get_data-1772125986809.txt`, // page 2
  `${TOOL_DIR}/mcp-be345d6d-3109-4f5f-9599-6a42bdc84336-4_get_data-1772126000267.txt`, // page 3
  `${TOOL_DIR}/mcp-be345d6d-3109-4f5f-9599-6a42bdc84336-4_get_data-1772126044739.txt`, // page 4
];

// ─── Subgroup → field key mapping ────────────────────────────────────────

/**
 * Maps (group, subgroup) pair to our output field name.
 * "Overall" subgroups use the major group name without the suffix.
 */
function getFieldKey(group, subgroup) {
  if (group === "General") return "general";
  if (subgroup === "Food and Beverages-Overall") return "foodBeverages";
  if (subgroup === "Clothing and Footwear-Overall") return "clothingFootwear";
  if (subgroup === "Housing-Overall") return "housing";
  if (subgroup === "Fuel and Light-Overall") return "fuelLight";
  if (subgroup === "Miscellaneous-Overall") return "miscellaneous";
  // Food sub-groups
  if (subgroup === "Cereals and Products") return "cereals";
  if (subgroup === "Pulses and Products") return "pulses";
  if (subgroup === "Oils and Fats") return "oilsFats";
  if (subgroup === "Milk and Products") return "milkProducts";
  if (subgroup === "Meat and Fish") return "meatFish";
  if (subgroup === "Vegetables") return "vegetables";
  if (subgroup === "Fruits") return "fruits";
  if (subgroup === "Spices") return "spices";
  return null;
}

// ─── Short month label helper ─────────────────────────────────────────────

const MONTH_SHORT = {
  January: "Jan", February: "Feb", March: "Mar", April: "Apr",
  May: "May", June: "Jun", July: "Jul", August: "Aug",
  September: "Sep", October: "Oct", November: "Nov", December: "Dec",
};

const MONTH_ORDER = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

// ─── Load and parse all pages ─────────────────────────────────────────────

console.log("=== Loading CPI tool-result files ===");

/** Map of "year-month" → { year, month, fields... } */
const monthMap = new Map();

let totalRows = 0;
let skippedRows = 0;

for (const filePath of CPI_FILES) {
  if (!existsSync(filePath)) {
    console.warn(`  WARN: File not found: ${filePath}`);
    continue;
  }

  const raw = JSON.parse(readFileSync(filePath, "utf8"));
  const meta = raw.meta_data;
  const rows = raw.data;
  console.log(`  Page ${meta.page}: ${rows.length} rows (totalRecords=${meta.totalRecords})`);
  totalRows += rows.length;

  for (const row of rows) {
    // Only process All India Combined
    if (row.state !== "All India" || row.sector !== "Combined") {
      skippedRows++;
      continue;
    }

    // Skip rows without inflation value
    if (row.inflation === null || row.inflation === undefined || row.inflation === "") {
      skippedRows++;
      continue;
    }

    const fieldKey = getFieldKey(row.group, row.subgroup);
    if (!fieldKey) {
      skippedRows++;
      continue;
    }

    const key = `${row.year}-${row.month}`;
    if (!monthMap.has(key)) {
      monthMap.set(key, {
        year: row.year,
        month: row.month,
        label: `${MONTH_SHORT[row.month] ?? row.month} ${row.year}`,
        // All 14 fields default to null
        general: null,
        foodBeverages: null,
        fuelLight: null,
        housing: null,
        clothingFootwear: null,
        miscellaneous: null,
        cereals: null,
        pulses: null,
        oilsFats: null,
        milkProducts: null,
        meatFish: null,
        vegetables: null,
        fruits: null,
        spices: null,
      });
    }

    const entry = monthMap.get(key);
    const val = parseFloat(row.inflation);
    entry[fieldKey] = isNaN(val) ? null : Math.round(val * 100) / 100;
  }
}

console.log(`\nTotal rows read: ${totalRows}`);
console.log(`Skipped (non-AllIndia/null/unmapped): ${skippedRows}`);
console.log(`Unique months captured: ${monthMap.size}`);

// ─── Sort months chronologically ──────────────────────────────────────────

const months = Array.from(monthMap.values()).sort((a, b) => {
  if (a.year !== b.year) return a.year - b.year;
  return MONTH_ORDER.indexOf(a.month) - MONTH_ORDER.indexOf(b.month);
});

// Print coverage stats
const fields = [
  "general","foodBeverages","fuelLight","housing","clothingFootwear","miscellaneous",
  "cereals","pulses","oilsFats","milkProducts","meatFish","vegetables","fruits","spices",
];
console.log("\nField coverage:");
for (const f of fields) {
  const n = months.filter(m => m[f] !== null).length;
  console.log(`  ${f.padEnd(20)}: ${n}/${months.length}`);
}

// ─── Build output ─────────────────────────────────────────────────────────

const output = {
  lastUpdated: "2026-02-26",
  baseYear: "2012",
  source: "MoSPI CPI",
  sourceUrl: "https://mospi.gov.in/web/mospi/inflation",
  notes:
    "All India Combined CPI. Base year 2012=100. " +
    "All values are YoY % change (pre-computed by MoSPI API). " +
    "Coverage: March 2014 – December 2025.",
  months,
};

// ─── Write output ─────────────────────────────────────────────────────────

if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

const outPath = join(OUTPUT_DIR, "cpi-monthly.json");
writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log(`\nWrote ${output.months.length} months → ${outPath}`);

// Print date range
if (months.length > 0) {
  const first = months[0];
  const last = months[months.length - 1];
  console.log(`Date range: ${first.month} ${first.year} → ${last.month} ${last.year}`);
}
