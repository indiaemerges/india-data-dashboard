/**
 * Pre-fetch all MoSPI Energy Balance data and write static JSON files.
 *
 * Fetches 12 years × 2 units = 24 combinations from the MoSPI API
 * and transforms each into SankeyData for the energy flow diagram.
 *
 * Run manually:  node scripts/prefetch-energy.mjs
 * Run via build:  npm run build  (chained before next build)
 *
 * NOTE: The transform logic here is duplicated from
 *   src/lib/utils/energy-transform.ts
 * If you change the transform, update both files.
 */

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "..", "public", "data", "mospi");

// ─── Configuration ─────────────────────────────────────────────────────

const MOSPI_BASE_URL = "https://api.mospi.gov.in/publisher/api/fetchData";

const ENERGY_YEARS = [
  "2023-24", "2022-23", "2021-22", "2020-21", "2019-20", "2018-19",
  "2017-18", "2016-17", "2015-16", "2014-15", "2013-14", "2012-13",
];

const UNITS = [
  { name: "KToE", code: "1" },
  { name: "PetaJoules", code: "2" },
];

const COMMODITY_CODES = "1,2,3,4,5,6,7,8,9";
const SUPPLY_SECTOR_CODES = "5,6,7,8,9";
const CONSUMPTION_SECTOR_CODES = "1,2,3,4,10";

const REQUEST_DELAY_MS = 500;

// ─── API helpers (from mospi-energy.ts) ────────────────────────────────

const COMMODITY_NAME_TO_CODE = {
  "Coal": 1, "Crude Oil": 2, "Oil Products": 3, "Natural Gas": 4,
  "Nuclear": 5, "Hydro": 6, "Solar, Wind, Others": 7, "Electricity": 8, "Lignite": 9,
};

const SECTOR_NAME_TO_CODE = {
  "Production": 5, "Imports": 6, "Exports": 7, "Stock changes": 8,
  "Total primary energy supply": 9,
  "Industry": 1, "Transport": 2, "Others": 3, "Non-energy use": 4, "Final consumption": 10,
};

function buildUrl(params) {
  const searchParams = new URLSearchParams({ ...params, Format: "JSON" });
  return `${MOSPI_BASE_URL}?${searchParams.toString()}`;
}

function mapRow(row) {
  return {
    year: row.year,
    commodity: row.energy_commodities,
    commodityCode: COMMODITY_NAME_TO_CODE[row.energy_commodities] ?? 0,
    sector: row.end_use_sector,
    sectorCode: SECTOR_NAME_TO_CODE[row.end_use_sector] ?? 0,
    subSector: row.end_use_sub_sector || undefined,
    value: row.value,
  };
}

async function fetchPage(params) {
  const url = buildUrl(params);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`MoSPI API error: ${response.status} ${response.statusText}`);
  }
  const json = await response.json();
  if (!json.statusCode) {
    throw new Error(`MoSPI API returned error: ${json.msg}`);
  }
  return json;
}

async function fetchAllPages(baseParams) {
  const params = { ...baseParams, limit: "200", page: "1" };
  const firstPage = await fetchPage(params);
  const rows = firstPage.data ?? [];
  const { totalPages } = firstPage.meta_data;

  if (totalPages > 1) {
    const pagePromises = [];
    for (let p = 2; p <= totalPages; p++) {
      pagePromises.push(fetchPage({ ...params, page: String(p) }));
    }
    const pages = await Promise.all(pagePromises);
    for (const page of pages) {
      if (page.data) rows.push(...page.data);
    }
  }
  return rows;
}

async function fetchEnergySupply(year, unitCode) {
  const rows = await fetchAllPages({
    indicator_code: unitCode,
    use_of_energy_balance_code: "1",
    year,
    energy_commodities_code: COMMODITY_CODES,
    end_use_sector_code: SUPPLY_SECTOR_CODES,
  });
  return rows.map(mapRow);
}

async function fetchEnergyConsumption(year, unitCode) {
  const rows = await fetchAllPages({
    indicator_code: unitCode,
    use_of_energy_balance_code: "2",
    year,
    energy_commodities_code: COMMODITY_CODES,
    end_use_sector_code: CONSUMPTION_SECTOR_CODES,
  });
  return rows.map(mapRow);
}

// ─── Sankey transform (from energy-transform.ts) ──────────────────────

const SANKEY_NODES = [
  { id: "production", label: "Production", color: "rgba(255,153,51,0.8)", column: 0 },
  { id: "imports", label: "Imports", color: "rgba(0,0,128,0.8)", column: 0 },
  { id: "coal", label: "Coal", color: "rgba(74,74,74,0.8)", column: 1 },
  { id: "crude_oil", label: "Crude Oil", color: "rgba(139,69,19,0.8)", column: 1 },
  { id: "natural_gas", label: "Natural Gas", color: "rgba(135,206,235,0.8)", column: 1 },
  { id: "hydro", label: "Hydro", color: "rgba(70,130,180,0.8)", column: 1 },
  { id: "nuclear", label: "Nuclear", color: "rgba(255,99,71,0.8)", column: 1 },
  { id: "solar_wind_others", label: "Solar/Wind/Others", color: "rgba(255,215,0,0.8)", column: 1 },
  { id: "lignite", label: "Lignite", color: "rgba(160,82,45,0.8)", column: 1 },
  { id: "oil_products", label: "Oil Products", color: "rgba(210,105,30,0.8)", column: 2 },
  { id: "electricity_gen", label: "Electricity Generation", color: "rgba(241,196,15,0.8)", column: 2 },
  { id: "electricity", label: "Electricity", color: "rgba(241,196,15,0.8)", column: 2 },
  { id: "industry", label: "Industry", color: "rgba(255,153,51,0.6)", column: 3 },
  { id: "transport", label: "Transport", color: "rgba(155,89,182,0.6)", column: 3 },
  { id: "others", label: "Others", color: "rgba(46,204,113,0.6)", column: 3 },
  { id: "non_energy_use", label: "Non-energy Use", color: "rgba(52,152,219,0.6)", column: 3 },
];

const nodeIndex = Object.fromEntries(SANKEY_NODES.map((n, i) => [n.id, i]));

function commodityToNodeId(commodity) {
  const map = {
    "Coal": "coal", "Crude Oil": "crude_oil", "Natural Gas": "natural_gas",
    "Hydro": "hydro", "Nuclear": "nuclear",
    "Solar, Wind, Others": "solar_wind_others", "Solar/Wind/Others": "solar_wind_others",
    "Lignite": "lignite", "Oil Products": "oil_products", "Electricity": "electricity",
  };
  return map[commodity] ?? null;
}

function sectorToNodeId(sector) {
  const map = {
    "Industry": "industry", "Transport": "transport", "Others": "others",
    "Non-energy use": "non_energy_use", "Non-energy Use": "non_energy_use",
  };
  return map[sector] ?? null;
}

const ELECTRICITY_FUEL_IDS = new Set([
  "coal", "lignite", "natural_gas", "hydro", "nuclear", "solar_wind_others",
]);

function withAlpha(rgba, alpha) {
  return rgba.replace(/[\d.]+\)$/, `${alpha})`);
}

function makeLink(source, target, value, sourceColor, sourceLabel, targetLabel) {
  return {
    source, target, value,
    color: withAlpha(sourceColor, 0.3),
    label: `${sourceLabel} \u2192 ${targetLabel}`,
  };
}

function transformEnergyBalance(supplyRows, consumptionRows, unit, year) {
  const nodes = [...SANKEY_NODES];
  const links = [];
  const commoditySupply = {};
  const commodityFinalConsumption = {};
  let totalSupply = 0;
  let totalConsumption = 0;

  // Step 1: Supply links
  for (const row of supplyRows) {
    if (row.value <= 0) continue;
    const commodityNodeId = commodityToNodeId(row.commodity);
    if (!commodityNodeId) continue;
    const commodityIdx = nodeIndex[commodityNodeId];
    if (commodityIdx === undefined) continue;

    let sourceNodeId = null;
    if (row.sector === "Production") sourceNodeId = "production";
    else if (row.sector === "Imports") sourceNodeId = "imports";
    if (!sourceNodeId) continue;

    const sourceIdx = nodeIndex[sourceNodeId];
    links.push(makeLink(sourceIdx, commodityIdx, row.value, nodes[sourceIdx].color, nodes[sourceIdx].label, nodes[commodityIdx].label));
    commoditySupply[commodityNodeId] = (commoditySupply[commodityNodeId] ?? 0) + row.value;
    if (sourceNodeId === "production") totalSupply += row.value;
  }

  for (const row of supplyRows) {
    if (row.sector === "Imports" && row.value > 0) totalSupply += row.value;
  }

  // Step 2: Consumption links
  for (const row of consumptionRows) {
    if (row.value <= 0) continue;
    if (row.subSector != null) continue;
    const sectorNodeId = sectorToNodeId(row.sector);
    if (!sectorNodeId) continue;
    const commodityNodeId = commodityToNodeId(row.commodity);
    if (!commodityNodeId) continue;
    if (commodityNodeId === "crude_oil") continue;

    const sectorIdx = nodeIndex[sectorNodeId];
    const commodityIdx = nodeIndex[commodityNodeId];
    if (sectorIdx === undefined || commodityIdx === undefined) continue;

    links.push(makeLink(commodityIdx, sectorIdx, row.value, nodes[commodityIdx].color, nodes[commodityIdx].label, nodes[sectorIdx].label));
    commodityFinalConsumption[commodityNodeId] = (commodityFinalConsumption[commodityNodeId] ?? 0) + row.value;
  }

  const finalConsumptionRows = consumptionRows.filter(
    (r) => r.sector === "Final consumption" && r.subSector == null && r.value > 0
  );
  if (finalConsumptionRows.length > 0) {
    totalConsumption = finalConsumptionRows.reduce((sum, r) => sum + r.value, 0);
  } else {
    totalConsumption = Object.values(commodityFinalConsumption).reduce((sum, v) => sum + v, 0);
  }

  // Step 3: Transformation links
  const crudeOilTotal = commoditySupply["crude_oil"] ?? 0;
  if (crudeOilTotal > 0) {
    const crudeIdx = nodeIndex["crude_oil"];
    const oilProdIdx = nodeIndex["oil_products"];
    links.push(makeLink(crudeIdx, oilProdIdx, crudeOilTotal, nodes[crudeIdx].color, nodes[crudeIdx].label, nodes[oilProdIdx].label));
  }

  const elecGenIdx = nodeIndex["electricity_gen"];
  for (const fuelId of ELECTRICITY_FUEL_IDS) {
    const supply = commoditySupply[fuelId] ?? 0;
    const directConsumption = commodityFinalConsumption[fuelId] ?? 0;
    const toElecGen = supply - directConsumption;
    if (toElecGen <= 0) continue;
    const fuelIdx = nodeIndex[fuelId];
    links.push(makeLink(fuelIdx, elecGenIdx, toElecGen, nodes[fuelIdx].color, nodes[fuelIdx].label, nodes[elecGenIdx].label));
  }

  const elecFinalConsumption = commodityFinalConsumption["electricity"] ?? 0;
  if (elecFinalConsumption > 0) {
    const elecIdx = nodeIndex["electricity"];
    links.push(makeLink(elecGenIdx, elecIdx, elecFinalConsumption, nodes[elecGenIdx].color, nodes[elecGenIdx].label, nodes[elecIdx].label));
  }

  const filteredLinks = links.filter((link) => link.value > 0);

  return { nodes, links: filteredLinks, unit, year, totalSupply, totalConsumption };
}

// ─── Orchestrator ──────────────────────────────────────────────────────

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const totalCombos = ENERGY_YEARS.length * UNITS.length;
  console.log(`\nPre-fetching energy data: ${ENERGY_YEARS.length} years \u00d7 ${UNITS.length} units = ${totalCombos} combinations\n`);

  let successCount = 0;
  let failCount = 0;
  const failures = [];

  for (const year of ENERGY_YEARS) {
    for (const { name: unitName, code: unitCode } of UNITS) {
      const filename = `energy-sankey-${year}-${unitName.toLowerCase()}.json`;
      const filepath = join(OUTPUT_DIR, filename);

      try {
        process.stdout.write(`  Fetching ${year} ${unitName}... `);

        const [supplyRows, consumptionRows] = await Promise.all([
          fetchEnergySupply(year, unitCode),
          fetchEnergyConsumption(year, unitCode),
        ]);

        const sankeyData = transformEnergyBalance(supplyRows, consumptionRows, unitName, year);

        writeFileSync(filepath, JSON.stringify(sankeyData, null, 2));
        console.log(`\u2713 ${sankeyData.links.length} flows`);
        successCount++;
      } catch (err) {
        console.log(`\u2717 ${err.message}`);
        failures.push({ year, unit: unitName, error: err.message });
        failCount++;
      }

      await delay(REQUEST_DELAY_MS);
    }
  }

  console.log(`\nDone: ${successCount} succeeded, ${failCount} failed out of ${totalCombos}`);

  if (failures.length > 0) {
    console.log("\nFailed combinations:");
    for (const f of failures) {
      console.log(`  - ${f.year} ${f.unit}: ${f.error}`);
    }
  }

  // Only fail the build if ALL combinations failed
  if (successCount === 0 && failCount > 0) {
    console.error("\nAll combinations failed. Aborting build.");
    process.exit(1);
  }

  console.log("");
}

main();
