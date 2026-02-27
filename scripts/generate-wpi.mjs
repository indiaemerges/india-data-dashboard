/**
 * generate-wpi.mjs
 * Wraps wpi_extracted.json with metadata and writes to public/data/mospi/wpi-monthly.json
 *
 * Run: node scripts/generate-wpi.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "..", "public", "data", "mospi");
const SOURCE_FILE = join(__dirname, "..", "..", "..", "project_India", "wpi_extracted.json");

// ─── Load source data ─────────────────────────────────────────────────────

if (!existsSync(SOURCE_FILE)) {
  console.error("ERROR: wpi_extracted.json not found at:", SOURCE_FILE);
  process.exit(1);
}

const raw = JSON.parse(readFileSync(SOURCE_FILE, "utf8"));

// Filter to only months that have at least one non-null field
const allMonths = raw.monthly;
const validMonths = allMonths.filter(
  (m) =>
    m.headline !== null ||
    m.primaryArticles !== null ||
    m.fuelPower !== null ||
    m.manufactured !== null ||
    m.foodIndex !== null
);

console.log(`Total months: ${allMonths.length}`);
console.log(`Months with data: ${validMonths.length}`);

const nonNull = (field) =>
  validMonths.filter((m) => m[field] !== null).length;

console.log(`  headline:        ${nonNull("headline")}`);
console.log(`  primaryArticles: ${nonNull("primaryArticles")}`);
console.log(`  fuelPower:       ${nonNull("fuelPower")}`);
console.log(`  manufactured:    ${nonNull("manufactured")}`);
console.log(`  foodIndex:       ${nonNull("foodIndex")}`);

// ─── Build output ─────────────────────────────────────────────────────────

const output = {
  lastUpdated: "2026-02-26",
  baseYear: "2011-12",
  source: "MoSPI WPI",
  sourceUrl: "https://mospi.gov.in/web/mospi/reports-publications/-/reports/view/templateOne/16904?q=16904",
  notes:
    "Wholesale Price Index, base year 2011-12=100. All values are YoY % change. " +
    "Manufactured Products coverage is partial (2024-25 onwards).",
  monthly: validMonths,
};

// ─── Write output ─────────────────────────────────────────────────────────

if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

const outPath = join(OUTPUT_DIR, "wpi-monthly.json");
writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log(`\nWrote ${output.monthly.length} months → ${outPath}`);

// Print date range
const first = validMonths[0];
const last = validMonths[validMonths.length - 1];
console.log(`Date range: ${first.month} ${first.year} → ${last.month} ${last.year}`);
