/**
 * generate-iip-monthly.mjs
 * Fetches monthly IIP data directly from MoSPI API and writes:
 *   public/data/mospi/iip-monthly.json
 *
 * Run: node scripts/generate-iip-monthly.mjs
 *
 * Covers: Apr 2012 – latest available (calendar year months)
 * Base year: 2011-12
 * Categories: General, Mining, Manufacturing, Electricity (sectoral)
 *             + Primary Goods, Capital Goods, Intermediate Goods,
 *               Infrastructure/Construction Goods, Consumer Durables,
 *               Consumer Non-durables (use-based)
 *
 * NOTE: If the MoSPI API blocks direct requests (HTML response),
 * use the MCP-tool-result approach instead:
 *   1. Call 4_get_data via the MoSPI MCP tool for each year with limit=500
 *   2. Concatenate all data arrays into scripts/raw-data/iip-monthly-raw.json
 *   3. This script will automatically use that file as a fallback if present.
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "data", "mospi");
const RAW_FALLBACK = join(__dirname, "raw-data", "iip-monthly-raw.json");
mkdirSync(OUT_DIR, { recursive: true });

const MOSPI_BASE = "https://api.mospi.gov.in/publisher/api/fetchData";
const BASE_YEAR = "2011-12";
const ALL_MONTHS = "1,2,3,4,5,6,7,8,9,10,11,12";
const ALL_CATEGORIES = "1,2,3,4,5,6,7,8,9,10";
const REQUEST_DELAY_MS = 400; // polite delay between requests

// ── Category → field key ──────────────────────────────────────────────────

const CAT_TO_FIELD = {
  "General": "general",
  "Mining": "mining",
  "Manufacturing": "manufacturing",
  "Electricity": "electricity",
  "Primary Goods": "primaryGoods",
  "Capital Goods": "capitalGoods",
  "Intermediate Goods": "intermediateGoods",
  "Infrastructure/ Construction Goods": "infraGoods",
  "Consumer Durables": "consumerDurables",
  "Consumer Non-durables": "consumerNonDurables",
};

const MONTH_SHORT = {
  January: "Jan", February: "Feb", March: "Mar", April: "Apr",
  May: "May", June: "Jun", July: "Jul", August: "Aug",
  September: "Sep", October: "Oct", November: "Nov", December: "Dec",
};

const MONTH_NUM = {
  January: 1, February: 2, March: 3, April: 4,
  May: 5, June: 6, July: 7, August: 8,
  September: 9, October: 10, November: 11, December: 12,
};

// ── Fetch helpers ─────────────────────────────────────────────────────────

async function fetchPage(year, page) {
  const params = new URLSearchParams({
    base_year: BASE_YEAR,
    type: "All",
    year: String(year),
    month_code: ALL_MONTHS,
    category_code: ALL_CATEGORIES,
    limit: "500",
    page: String(page),
    Format: "JSON",
  });
  const url = `${MOSPI_BASE}?${params}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; India-Data-Dashboard/1.0)",
      "Accept": "application/json, text/plain, */*",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for year ${year} page ${page}`);
  const text = await res.text();
  if (text.trim().startsWith("<")) {
    throw new Error(`API returned HTML for year ${year} page ${page} — try MCP fallback`);
  }
  const json = JSON.parse(text);
  if (!json.statusCode) throw new Error(`API error for year ${year}: ${json.msg}`);
  return json;
}

async function fetchAllPagesForYear(year) {
  const first = await fetchPage(year, 1);
  const rows = first.data ?? [];
  const { totalPages } = first.meta_data ?? { totalPages: 1 };
  for (let p = 2; p <= totalPages; p++) {
    await delay(REQUEST_DELAY_MS);
    const page = await fetchPage(year, p);
    if (page.data) rows.push(...page.data);
  }
  return rows;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Build output from a flat rows array ───────────────────────────────────

function processRows(rows) {
  const allRecords = {}; // keyed by "YYYY-MM"

  for (const row of rows) {
    // Skip sub-category rows (Manufacturing sub-groups)
    if (row.sub_category && row.sub_category !== "") continue;

    const field = CAT_TO_FIELD[row.category];
    if (!field) continue;

    const monthName = row.month;
    const m = String(MONTH_NUM[monthName]).padStart(2, "0");
    const key = `${row.year}-${m}`;

    if (!allRecords[key]) {
      allRecords[key] = {
        year: row.year,
        month: monthName,
        label: `${MONTH_SHORT[monthName]} ${row.year}`,
        date: `${row.year}-${m}`,
        general: { index: null, growth: null },
        mining: { index: null, growth: null },
        manufacturing: { index: null, growth: null },
        electricity: { index: null, growth: null },
        primaryGoods: { index: null, growth: null },
        capitalGoods: { index: null, growth: null },
        intermediateGoods: { index: null, growth: null },
        infraGoods: { index: null, growth: null },
        consumerDurables: { index: null, growth: null },
        consumerNonDurables: { index: null, growth: null },
      };
    }

    allRecords[key][field] = {
      index:  row.index  !== "" && row.index  !== null ? parseFloat(row.index)  : null,
      growth: row.growth_rate !== "" && row.growth_rate !== null ? parseFloat(row.growth_rate) : null,
    };
  }

  return Object.values(allRecords)
    .filter((r) => r.general.index !== null)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

// ── Main ──────────────────────────────────────────────────────────────────

// Check for pre-saved MCP tool-result fallback
if (existsSync(RAW_FALLBACK)) {
  console.log(`Using pre-saved raw data from ${RAW_FALLBACK}`);
  const rows = JSON.parse(readFileSync(RAW_FALLBACK, "utf8"));
  const monthly = processRows(rows);
  if (monthly.length === 0) {
    console.error("✗ Fallback file contained no usable records.");
    process.exit(1);
  }
  const latest = monthly.at(-1);
  const output = {
    baseYear: BASE_YEAR,
    lastUpdated: latest.date,
    source: "MoSPI, Index of Industrial Production",
    sourceUrl: "https://mospi.gov.in/iip",
    notes:
      "Monthly IIP index (base 2011-12=100) and YoY growth rate (%). " +
      "Calendar year months. Excludes manufacturing sub-industry rows. " +
      "IIP is typically released with a 6-week lag.",
    monthly,
  };
  const outPath = join(OUT_DIR, "iip-monthly.json");
  writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`✓ Wrote ${monthly.length} months (${monthly[0].date} → ${latest.date})`);
  console.log(`  → ${outPath}`);
  process.exit(0);
}

// Direct API fetch (requires MoSPI API to be accessible from Node.js)
const currentYear = new Date().getFullYear();
const YEARS = [];
for (let y = 2012; y <= Math.min(currentYear, 2025); y++) YEARS.push(y);

console.log(`Fetching IIP monthly data for years ${YEARS[0]}–${YEARS.at(-1)} …`);

const allRows = [];
let successCount = 0;

for (const year of YEARS) {
  process.stdout.write(`  ${year} … `);
  await delay(REQUEST_DELAY_MS);
  try {
    const rows = await fetchAllPagesForYear(year);
    allRows.push(...rows);
    const useful = rows.filter((r) => !r.sub_category && CAT_TO_FIELD[r.category]);
    console.log(`${rows.length} rows (${useful.length} category-level)`);
    successCount++;
  } catch (err) {
    console.error(`\n  ERROR for ${year}: ${err.message}`);
  }
}

if (successCount === 0) {
  console.error(
    "\n✗ All years failed. The MoSPI API may require authentication headers.\n" +
    "  Alternative: fetch data via the MoSPI MCP tool and save to\n" +
    "  scripts/raw-data/iip-monthly-raw.json, then re-run this script."
  );
  process.exit(1);
}

const monthly = processRows(allRows);

if (monthly.length === 0) {
  console.error("✗ No valid monthly records after processing.");
  process.exit(1);
}

const latest = monthly.at(-1);
const output = {
  baseYear: BASE_YEAR,
  lastUpdated: latest.date,
  source: "MoSPI, Index of Industrial Production",
  sourceUrl: "https://mospi.gov.in/iip",
  notes:
    "Monthly IIP index (base 2011-12=100) and YoY growth rate (%). " +
    "Calendar year months. Excludes manufacturing sub-industry rows. " +
    "IIP is typically released with a 6-week lag.",
  monthly,
};

const outPath = join(OUT_DIR, "iip-monthly.json");
writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log(`\n✓ Wrote ${monthly.length} months (${monthly[0].date} → ${latest.date})`);
console.log(`  → ${outPath}`);
