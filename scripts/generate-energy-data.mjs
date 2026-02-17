/**
 * Generate all 24 static JSON files for the India Energy Sankey diagram.
 *
 * This script is SELF-CONTAINED: it embeds verified MoSPI supply data for
 * all 12 years (2012-13 to 2023-24) and verified consumption data for 2023-24.
 *
 * For other years' consumption data, it:
 *   1. First tries to load overrides from scripts/raw-data/consumption-overrides.json
 *   2. Falls back to proportional estimation from supply data
 *
 * Writes 24 files (12 years x 2 units):
 *   public/data/mospi/energy-sankey-{year}-ktoe.json
 *   public/data/mospi/energy-sankey-{year}-petajoules.json
 *
 * Conversion: 1 KToE = 0.04187 PetaJoules
 *
 * Run:  node scripts/generate-energy-data.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// ─── Path setup ─────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW_DATA_DIR = join(__dirname, "raw-data");
const OUTPUT_DIR = join(__dirname, "..", "public", "data", "mospi");

// ─── Configuration ──────────────────────────────────────────────────────

const ENERGY_YEARS = [
  "2023-24", "2022-23", "2021-22", "2020-21", "2019-20", "2018-19",
  "2017-18", "2016-17", "2015-16", "2014-15", "2013-14", "2012-13",
];

/** Conversion factor: 1 KToE = 0.04187 PetaJoules (verified from MoSPI data) */
const KTOE_TO_PJ = 0.04187;

// ═══════════════════════════════════════════════════════════════════════
// EMBEDDED DATA -- Verified from MoSPI Energy Balance API
// ═══════════════════════════════════════════════════════════════════════

/**
 * SUPPLY DATA (all 12 years, in KToE)
 *
 * For each year and commodity, Production and Imports values.
 * These are the only supply-side use_of_energy_balance entries used
 * for building Sankey source links (Production -> Commodity, Imports -> Commodity).
 *
 * Source: MoSPI Energy Balance dataset via API
 */
const SUPPLY_DATA = {
  "2023-24": {
    "Coal": { Production: 403799.46, Imports: 141638.82 },
    "Crude Oil": { Production: 30002.27, Imports: 239414.80 },
    "Natural Gas": { Production: 33704.73, Imports: 29410.30 },
    "Hydro": { Production: 11558.82, Imports: 0 },
    "Nuclear": { Production: 12492.78, Imports: 0 },
    "Solar, Wind, Others": { Production: 20288.67, Imports: 0 },
    "Lignite": { Production: 9786.09, Imports: 11.88 },
    "Oil Products": { Production: 0, Imports: 48202.82 },
    "Electricity": { Production: 0, Imports: 571.79 },
  },
  "2022-23": {
    "Coal": { Production: 359797.83, Imports: 126342.73 },
    "Crude Oil": { Production: 29820.95, Imports: 237819.29 },
    "Natural Gas": { Production: 31866.22, Imports: 24331.37 },
    "Hydro": { Production: 13965.49, Imports: 0 },
    "Nuclear": { Production: 11951.68, Imports: 0 },
    "Solar, Wind, Others": { Production: 18252.85, Imports: 0 },
    "Lignite": { Production: 10038.71, Imports: 5.22 },
    "Oil Products": { Production: 0, Imports: 44702.72 },
    "Electricity": { Production: 0, Imports: 657.02 },
  },
  "2021-22": {
    "Coal": { Production: 312680.97, Imports: 115989.25 },
    "Crude Oil": { Production: 30343.85, Imports: 217053.53 },
    "Natural Gas": { Production: 31471.48, Imports: 28700.65 },
    "Hydro": { Production: 13070.62, Imports: 0 },
    "Nuclear": { Production: 12277.69, Imports: 0 },
    "Solar, Wind, Others": { Production: 15284.37, Imports: 0 },
    "Lignite": { Production: 10828.28, Imports: 2.57 },
    "Oil Products": { Production: 0, Imports: 39911.65 },
    "Electricity": { Production: 0, Imports: 685.76 },
  },
  "2020-21": {
    "Coal": { Production: 297774.74, Imports: 115541.29 },
    "Crude Oil": { Production: 31164.89, Imports: 200782.55 },
    "Natural Gas": { Production: 26521.88, Imports: 30553.74 },
    "Hydro": { Production: 12954.92, Imports: 0 },
    "Nuclear": { Production: 11213.64, Imports: 0 },
    "Solar, Wind, Others": { Production: 13278.87, Imports: 0 },
    "Lignite": { Production: 9553.92, Imports: 0.82 },
    "Oil Products": { Production: 0, Imports: 42915.38 },
    "Electricity": { Production: 0, Imports: 821.10 },
  },
  "2019-20": {
    "Coal": { Production: 308651.92, Imports: 130996.86 },
    "Crude Oil": { Production: 32876.92, Imports: 231947.15 },
    "Natural Gas": { Production: 28685.04, Imports: 31170.93 },
    "Hydro": { Production: 13426.08, Imports: 0 },
    "Nuclear": { Production: 12111.00, Imports: 0 },
    "Solar, Wind, Others": { Production: 12439.68, Imports: 0 },
    "Lignite": { Production: 10175.43, Imports: 2.64 },
    "Oil Products": { Production: 0, Imports: 43047.24 },
    "Electricity": { Production: 0, Imports: 546.15 },
  },
  "2018-19": {
    "Coal": { Production: 310731.41, Imports: 123696.31 },
    "Crude Oil": { Production: 34955.64, Imports: 231480.04 },
    "Natural Gas": { Production: 30238.82, Imports: 26437.13 },
    "Hydro": { Production: 11624.07, Imports: 0 },
    "Nuclear": { Production: 9854.19, Imports: 0 },
    "Solar, Wind, Others": { Production: 11217.24, Imports: 0 },
    "Lignite": { Production: 10484.26, Imports: 76.96 },
    "Oil Products": { Production: 0, Imports: 33119.79 },
    "Electricity": { Production: 0, Imports: 378.04 },
  },
  "2017-18": {
    "Coal": { Production: 289970.60, Imports: 110333.76 },
    "Crude Oil": { Production: 36469.31, Imports: 225281.81 },
    "Natural Gas": { Production: 30032.71, Imports: 25239.93 },
    "Hydro": { Production: 10856.23, Imports: 0 },
    "Nuclear": { Production: 9993.23, Imports: 0 },
    "Solar, Wind, Others": { Production: 8958.42, Imports: 0 },
    "Lignite": { Production: 10437.38, Imports: 32.41 },
    "Oil Products": { Production: 0, Imports: 33920.34 },
    "Electricity": { Production: 0, Imports: 436.20 },
  },
  "2016-17": {
    "Coal": { Production: 290295.92, Imports: 101177.63 },
    "Crude Oil": { Production: 36800.94, Imports: 218637.84 },
    "Natural Gas": { Production: 29340.42, Imports: 22857.53 },
    "Hydro": { Production: 10536.82, Imports: 0 },
    "Nuclear": { Production: 9881.11, Imports: 0 },
    "Solar, Wind, Others": { Production: 7208.97, Imports: 0 },
    "Lignite": { Production: 9952.88, Imports: 3.02 },
    "Oil Products": { Production: 0, Imports: 34412.35 },
    "Electricity": { Production: 0, Imports: 483.09 },
  },
  "2015-16": {
    "Coal": { Production: 285600.07, Imports: 107058.46 },
    "Crude Oil": { Production: 37754.39, Imports: 207312.74 },
    "Natural Gas": { Production: 29664.69, Imports: 19674.17 },
    "Hydro": { Production: 10447.86, Imports: 0 },
    "Nuclear": { Production: 9750.22, Imports: 0 },
    "Solar, Wind, Others": { Production: 5833.12, Imports: 0 },
    "Lignite": { Production: 10543.92, Imports: 1.98 },
    "Oil Products": { Production: 0, Imports: 28362.25 },
    "Electricity": { Production: 0, Imports: 451.00 },
  },
  "2014-15": {
    "Coal": { Production: 274301.05, Imports: 110186.74 },
    "Crude Oil": { Production: 38285.05, Imports: 193601.99 },
    "Natural Gas": { Production: 30960.05, Imports: 17115.36 },
    "Hydro": { Production: 11127.40, Imports: 0 },
    "Nuclear": { Production: 9408.28, Imports: 0 },
    "Solar, Wind, Others": { Production: 6554.89, Imports: 0 },
    "Lignite": { Production: 10527.32, Imports: 4.37 },
    "Oil Products": { Production: 0, Imports: 20887.26 },
    "Electricity": { Production: 0, Imports: 430.67 },
  },
  "2013-14": {
    "Coal": { Production: 256930.84, Imports: 83249.70 },
    "Crude Oil": { Production: 38619.70, Imports: 193401.01 },
    "Natural Gas": { Production: 32569.29, Imports: 16374.20 },
    "Hydro": { Production: 11607.99, Imports: 0 },
    "Nuclear": { Production: 8919.97, Imports: 0 },
    "Solar, Wind, Others": { Production: 5798.32, Imports: 0 },
    "Lignite": { Production: 10654.50, Imports: 5.44 },
    "Oil Products": { Production: 0, Imports: 16637.49 },
    "Electricity": { Production: 0, Imports: 481.42 },
  },
  "2012-13": {
    "Coal": { Production: 253772.52, Imports: 74274.78 },
    "Crude Oil": { Production: 38692.83, Imports: 188860.32 },
    "Natural Gas": { Production: 37419.81, Imports: 16202.74 },
    "Hydro": { Production: 9790.11, Imports: 0 },
    "Nuclear": { Production: 8565.11, Imports: 0 },
    "Solar, Wind, Others": { Production: 5091.14, Imports: 0 },
    "Lignite": { Production: 10797.75, Imports: 0.35 },
    "Oil Products": { Production: 0, Imports: 16425.56 },
    "Electricity": { Production: 0, Imports: 412.33 },
  },
};

/**
 * CONSUMPTION DATA (verified from MoSPI API)
 *
 * Sector-level totals only (where end_use_sub_sector is null).
 * For each commodity, the breakdown into: Industry, Transport, Others, Non-energy use.
 * "Final consumption" is the row total (sum of the four sectors).
 *
 * Commodities with zero across all sectors (Crude Oil, Hydro, Nuclear, Solar/Wind)
 * are omitted but handled gracefully by the estimation logic.
 */
const CONSUMPTION_DATA = {
  "2023-24": {
    "Coal": { Industry: 200947.38, Transport: 0, Others: 0, "Non-energy use": 0, "Final consumption": 200947.38 },
    "Crude Oil": { Industry: 0, Transport: 0, Others: 0, "Non-energy use": 0, "Final consumption": 0 },
    "Natural Gas": { Industry: 1348.41, Transport: 14258.81, Others: 1057.22, "Non-energy use": 23022.90, "Final consumption": 39687.34 },
    "Hydro": { Industry: 0, Transport: 0, Others: 0, "Non-energy use": 0, "Final consumption": 0 },
    "Nuclear": { Industry: 0, Transport: 0, Others: 0, "Non-energy use": 0, "Final consumption": 0 },
    "Solar, Wind, Others": { Industry: 0, Transport: 0, Others: 0, "Non-energy use": 0, "Final consumption": 0 },
    "Lignite": { Industry: 1584.87, Transport: 0, Others: 0, "Non-energy use": 0, "Final consumption": 1584.87 },
    "Oil Products": { Industry: 34456.93, Transport: 147680.08, Others: 46723.92, "Non-energy use": 23425.37, "Final consumption": 252286.30 },
    "Electricity": { Industry: 55470, Transport: 2838, Others: 74390, "Non-energy use": 0, "Final consumption": 132698 },
  },
};

// ═══════════════════════════════════════════════════════════════════════
// CONSUMPTION ESTIMATION HEURISTICS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Estimate consumption data for a year from supply data using sector-split
 * heuristics derived from the verified 2023-24 proportions.
 *
 * These percentages approximate the sector distribution observed in real data:
 *   - Coal: ~100% Industry (power plants, steel, cement)
 *   - Crude Oil: 0 direct consumption (fully refined into Oil Products)
 *   - Natural Gas: ~3% Industry, ~36% Transport, ~3% Others, ~58% Non-energy use
 *   - Hydro/Nuclear/Solar,Wind,Others: 0 direct final consumption (all -> electricity)
 *   - Lignite: ~16% of total supply goes to Industry
 *   - Oil Products: Total market supply = Crude Oil supply + Oil Product imports
 *     Split: ~59% Transport, ~14% Industry, ~18% Others, ~9% Non-energy use
 *   - Electricity: Proportional to total electricity supply
 *     Split: ~42% Industry, ~56% Others, ~2% Transport
 *
 * @param {object} yearSupply - Supply data for the year { commodity: { Production, Imports } }
 * @returns {object} Estimated consumption { commodity: { Industry, Transport, Others, "Non-energy use", "Final consumption" } }
 */
function estimateConsumption(yearSupply) {
  const result = {};

  // Helper: total supply for a commodity = Production + Imports
  function totalSupply(commodity) {
    const s = yearSupply[commodity];
    if (!s) return 0;
    return (s.Production || 0) + (s.Imports || 0);
  }

  // ── Coal: ~37% of total supply goes to final consumption (Industry) ──
  // In 2023-24: supply=545438, final=200947 => ~36.8%. We use the ratio.
  const coalSupply = totalSupply("Coal");
  const coalFinal = coalSupply * 0.368;
  result["Coal"] = {
    Industry: coalFinal,
    Transport: 0,
    Others: 0,
    "Non-energy use": 0,
    "Final consumption": coalFinal,
  };

  // ── Crude Oil: 0 direct final consumption ──
  result["Crude Oil"] = {
    Industry: 0, Transport: 0, Others: 0, "Non-energy use": 0, "Final consumption": 0,
  };

  // ── Natural Gas: ~63% of supply goes to final consumption ──
  // In 2023-24: supply=63115, final=39687 => ~62.9%
  // Sector split: Industry ~3.4%, Transport ~35.9%, Others ~2.7%, Non-energy ~58%
  const gasSupply = totalSupply("Natural Gas");
  const gasFinal = gasSupply * 0.629;
  result["Natural Gas"] = {
    Industry: gasFinal * 0.034,
    Transport: gasFinal * 0.359,
    Others: gasFinal * 0.027,
    "Non-energy use": gasFinal * 0.580,
    "Final consumption": gasFinal,
  };

  // ── Hydro, Nuclear, Solar/Wind: 0 final consumption ──
  for (const c of ["Hydro", "Nuclear", "Solar, Wind, Others"]) {
    result[c] = {
      Industry: 0, Transport: 0, Others: 0, "Non-energy use": 0, "Final consumption": 0,
    };
  }

  // ── Lignite: ~16% of supply goes to Industry ──
  // In 2023-24: supply=9798, final=1585 => ~16.2%
  const ligniteSupply = totalSupply("Lignite");
  const ligniteFinal = ligniteSupply * 0.162;
  result["Lignite"] = {
    Industry: ligniteFinal,
    Transport: 0,
    Others: 0,
    "Non-energy use": 0,
    "Final consumption": ligniteFinal,
  };

  // ── Oil Products: market supply = Crude Oil supply + Oil Products imports ──
  // In 2023-24: crude supply=269417 + OilProd imports=48203 = 317620 total market
  //             final consumption = 252286 => ~79.4% of market supply
  // Sector split: Transport ~58.5%, Industry ~13.7%, Others ~18.5%, Non-energy ~9.3%
  const crudeSupply = totalSupply("Crude Oil");
  const oilProdImports = totalSupply("Oil Products"); // Oil Products supply = imports only (Production=0)
  const oilMarketSupply = crudeSupply + oilProdImports;
  const oilFinal = oilMarketSupply * 0.794;
  result["Oil Products"] = {
    Industry: oilFinal * 0.137,
    Transport: oilFinal * 0.585,
    Others: oilFinal * 0.185,
    "Non-energy use": oilFinal * 0.093,
    "Final consumption": oilFinal,
  };

  // ── Electricity: final consumption estimated from generation capacity ──
  // Electricity is generated from coal, gas, hydro, nuclear, solar/wind, lignite.
  // In 2023-24: total electricity supply inputs ~ 440k KToE, final consumption = 132698
  // Ratio of final elec consumption to total generation fuel input varies.
  // We use a simpler approach: scale from total primary energy supply proportionally.
  //
  // In 2023-24: total primary supply (all commodities) = ~981k KToE
  //             electricity final = 132698 => ~13.5% of total primary supply
  // But a more robust approach: electricity final ~ 20% of (coal+gas+hydro+nuclear+solar+lignite supply)
  // In 2023-24: those fuels supply = 545438+63115+11559+12493+20289+9798 = 662692
  //             electricity final = 132698 => ~20.0%
  const elecFuelSupply = totalSupply("Coal") + totalSupply("Natural Gas") +
    totalSupply("Hydro") + totalSupply("Nuclear") +
    totalSupply("Solar, Wind, Others") + totalSupply("Lignite");
  const elecImports = totalSupply("Electricity"); // imported electricity
  const elecFinal = (elecFuelSupply * 0.200) + elecImports;
  // Sector split: Industry ~41.8%, Others ~56.1%, Transport ~2.1%
  result["Electricity"] = {
    Industry: elecFinal * 0.418,
    Transport: elecFinal * 0.021,
    Others: elecFinal * 0.561,
    "Non-energy use": 0,
    "Final consumption": elecFinal,
  };

  return result;
}

// ═══════════════════════════════════════════════════════════════════════
// LOAD CONSUMPTION OVERRIDES (optional file)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Try to load consumption overrides from scripts/raw-data/consumption-overrides.json.
 *
 * Expected format:
 * {
 *   "2022-23": {
 *     "Coal": { "Industry": 190000, "Transport": 0, "Others": 0, "Non-energy use": 0, "Final consumption": 190000 },
 *     ...
 *   },
 *   ...
 * }
 *
 * @returns {object} Overrides keyed by year, or empty object if file not found
 */
function loadConsumptionOverrides() {
  const filepath = join(RAW_DATA_DIR, "consumption-overrides.json");
  if (!existsSync(filepath)) {
    return {};
  }

  try {
    const raw = readFileSync(filepath, "utf-8");
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) {
      console.warn(`  WARNING: consumption-overrides.json is not a valid object, ignoring.`);
      return {};
    }
    console.log(`  Loaded consumption overrides from: ${filepath}`);
    return parsed;
  } catch (err) {
    console.warn(`  WARNING: Failed to read consumption-overrides.json: ${err.message}`);
    return {};
  }
}

// ═══════════════════════════════════════════════════════════════════════
// RESOLVE CONSUMPTION: embedded -> overrides -> estimation
// ═══════════════════════════════════════════════════════════════════════

/**
 * Get the final consumption data for a given year.
 *
 * Priority:
 *   1. Embedded CONSUMPTION_DATA (highest confidence - verified from API)
 *   2. Override file data (user-provided corrections)
 *   3. Proportional estimation from supply data (fallback)
 *
 * @param {string} year - Fiscal year string
 * @param {object} overrides - Loaded overrides from file
 * @returns {{ data: object, source: string }}
 */
function getConsumptionForYear(year, overrides) {
  // 1. Check embedded verified data
  if (CONSUMPTION_DATA[year]) {
    return { data: CONSUMPTION_DATA[year], source: "embedded (verified)" };
  }

  // 2. Check overrides file
  if (overrides[year]) {
    return { data: overrides[year], source: "overrides file" };
  }

  // 3. Estimate from supply data
  if (!SUPPLY_DATA[year]) {
    return { data: {}, source: "none (no supply data)" };
  }

  return { data: estimateConsumption(SUPPLY_DATA[year]), source: "estimated" };
}

// ═══════════════════════════════════════════════════════════════════════
// CONVERT EMBEDDED DATA TO ROW FORMAT
// ═══════════════════════════════════════════════════════════════════════

/**
 * Convert embedded supply data for a year into the internal row format
 * used by transformEnergyBalance().
 *
 * Each row: { year, commodity, sector, subSector, value }
 * where sector is "Production" or "Imports".
 *
 * @param {string} year
 * @returns {Array}
 */
function supplyDataToRows(year) {
  const yearData = SUPPLY_DATA[year];
  if (!yearData) return [];

  const rows = [];
  for (const [commodity, sources] of Object.entries(yearData)) {
    if (sources.Production > 0) {
      rows.push({
        year,
        commodity,
        sector: "Production",
        subSector: undefined,
        value: sources.Production,
      });
    }
    if (sources.Imports > 0) {
      rows.push({
        year,
        commodity,
        sector: "Imports",
        subSector: undefined,
        value: sources.Imports,
      });
    }
  }
  return rows;
}

/**
 * Convert consumption data (from any source) for a year into the internal
 * row format used by transformEnergyBalance().
 *
 * Each row: { year, commodity, sector, subSector, value }
 * where sector is one of: Industry, Transport, Others, Non-energy use, Final consumption.
 *
 * Only sector-level totals are generated (subSector = undefined).
 *
 * @param {string} year
 * @param {object} consumptionMap - { commodity: { sector: value } }
 * @returns {Array}
 */
function consumptionDataToRows(year, consumptionMap) {
  if (!consumptionMap) return [];

  const rows = [];
  const sectors = ["Industry", "Transport", "Others", "Non-energy use", "Final consumption"];

  for (const [commodity, sectorValues] of Object.entries(consumptionMap)) {
    for (const sector of sectors) {
      const value = sectorValues[sector];
      if (value !== undefined && value > 0) {
        rows.push({
          year,
          commodity,
          sector,
          subSector: undefined,
          value,
        });
      }
    }
  }
  return rows;
}

// ─── 16 Sankey Nodes ────────────────────────────────────────────────────

const SANKEY_NODES = [
  // Column 0 -- Sources
  { id: "production", label: "Production", color: "rgba(255,153,51,0.8)", column: 0 },
  { id: "imports", label: "Imports", color: "rgba(0,0,128,0.8)", column: 0 },

  // Column 1 -- Primary Energy
  { id: "coal", label: "Coal", color: "rgba(74,74,74,0.8)", column: 1 },
  { id: "crude_oil", label: "Crude Oil", color: "rgba(139,69,19,0.8)", column: 1 },
  { id: "natural_gas", label: "Natural Gas", color: "rgba(135,206,235,0.8)", column: 1 },
  { id: "hydro", label: "Hydro", color: "rgba(70,130,180,0.8)", column: 1 },
  { id: "nuclear", label: "Nuclear", color: "rgba(255,99,71,0.8)", column: 1 },
  { id: "solar_wind_others", label: "Solar/Wind/Others", color: "rgba(255,215,0,0.8)", column: 1 },
  { id: "lignite", label: "Lignite", color: "rgba(160,82,45,0.8)", column: 1 },

  // Column 2 -- Transformation
  { id: "oil_products", label: "Oil Products", color: "rgba(210,105,30,0.8)", column: 2 },
  { id: "electricity_gen", label: "Electricity Generation", color: "rgba(241,196,15,0.8)", column: 2 },
  { id: "electricity", label: "Electricity", color: "rgba(241,196,15,0.8)", column: 2 },

  // Column 3 -- End-Use Sectors
  { id: "industry", label: "Industry", color: "rgba(255,153,51,0.6)", column: 3 },
  { id: "transport", label: "Transport", color: "rgba(155,89,182,0.6)", column: 3 },
  { id: "others", label: "Others", color: "rgba(46,204,113,0.6)", column: 3 },
  { id: "non_energy_use", label: "Non-energy Use", color: "rgba(52,152,219,0.6)", column: 3 },
];

/** Mapping from node id to its index in SANKEY_NODES */
const nodeIndex = Object.fromEntries(SANKEY_NODES.map((n, i) => [n.id, i]));

// ─── Commodity / Sector name mappings ───────────────────────────────────

/** Normalize MoSPI commodity names to node ids */
function commodityToNodeId(commodity) {
  const map = {
    "Coal": "coal",
    "Crude Oil": "crude_oil",
    "Natural Gas": "natural_gas",
    "Hydro": "hydro",
    "Nuclear": "nuclear",
    "Solar, Wind, Others": "solar_wind_others",
    "Solar/Wind/Others": "solar_wind_others",
    "Lignite": "lignite",
    "Oil Products": "oil_products",
    "Electricity": "electricity",
  };
  return map[commodity] ?? null;
}

/** Normalize MoSPI end-use sector names to node ids */
function sectorToNodeId(sector) {
  const map = {
    "Industry": "industry",
    "Transport": "transport",
    "Others": "others",
    "Non-energy use": "non_energy_use",
    "Non-energy Use": "non_energy_use",
  };
  return map[sector] ?? null;
}

/** Commodities that feed into electricity generation */
const ELECTRICITY_FUEL_IDS = new Set([
  "coal", "lignite", "natural_gas", "hydro", "nuclear", "solar_wind_others",
]);

// ─── Helpers ────────────────────────────────────────────────────────────

/** Replace the alpha channel of an RGBA color string */
function withAlpha(rgba, alpha) {
  return rgba.replace(/[\d.]+\)$/, `${alpha})`);
}

/** Create a link object */
function makeLink(source, target, value, sourceColor, sourceLabel, targetLabel) {
  return {
    source,
    target,
    value,
    color: withAlpha(sourceColor, 0.3),
    label: `${sourceLabel} \u2192 ${targetLabel}`,
  };
}

// ─── Main transform (exact replica of energy-transform.ts) ─────────────

/**
 * Transform mapped supply and consumption rows into SankeyData.
 *
 * @param {Array} supplyRows      - Mapped supply rows
 * @param {Array} consumptionRows - Mapped consumption rows
 * @param {string} unit           - "KToE" or "PetaJoules"
 * @param {string} year           - Fiscal year string (e.g., "2023-24")
 * @returns {object}              - SankeyData object
 */
function transformEnergyBalance(supplyRows, consumptionRows, unit, year) {
  const nodes = [...SANKEY_NODES];
  const links = [];

  // Track totals per commodity for transformation links
  const commoditySupply = {};
  // Track how much of each commodity goes to final consumption (for electricity split)
  const commodityFinalConsumption = {};

  let totalSupply = 0;
  let totalConsumption = 0;

  // ── Step 1: Build supply links (Source -> Primary Energy) ──────────

  for (const row of supplyRows) {
    if (row.value <= 0) continue;

    const commodityNodeId = commodityToNodeId(row.commodity);
    if (!commodityNodeId) continue;

    const commodityIdx = nodeIndex[commodityNodeId];
    if (commodityIdx === undefined) continue;

    let sourceNodeId = null;
    if (row.sector === "Production") {
      sourceNodeId = "production";
    } else if (row.sector === "Imports") {
      sourceNodeId = "imports";
    }

    if (!sourceNodeId) continue;

    const sourceIdx = nodeIndex[sourceNodeId];
    const sourceNode = nodes[sourceIdx];
    const targetNode = nodes[commodityIdx];

    links.push(
      makeLink(sourceIdx, commodityIdx, row.value, sourceNode.color, sourceNode.label, targetNode.label)
    );

    // Accumulate total supply per commodity
    commoditySupply[commodityNodeId] = (commoditySupply[commodityNodeId] ?? 0) + row.value;

    // Sum domestic production for totalSupply
    if (sourceNodeId === "production") {
      totalSupply += row.value;
    }
  }

  // Also add imports to totalSupply for the TPES figure
  for (const row of supplyRows) {
    if (row.sector === "Imports" && row.value > 0) {
      totalSupply += row.value;
    }
  }

  // ── Step 2: Build consumption links (Commodity/Electricity -> End-Use) ─

  for (const row of consumptionRows) {
    if (row.value <= 0) continue;

    // Only use sector-level totals (subSector is null/undefined)
    if (row.subSector != null) continue;

    const sectorNodeId = sectorToNodeId(row.sector);
    if (!sectorNodeId) continue;

    const commodityNodeId = commodityToNodeId(row.commodity);
    if (!commodityNodeId) continue;

    // Skip Crude Oil consumption rows -- crude oil goes through Oil Products
    if (commodityNodeId === "crude_oil") continue;

    const sectorIdx = nodeIndex[sectorNodeId];
    const commodityIdx = nodeIndex[commodityNodeId];
    if (sectorIdx === undefined || commodityIdx === undefined) continue;

    const sourceNode = nodes[commodityIdx];
    const targetNode = nodes[sectorIdx];

    links.push(
      makeLink(commodityIdx, sectorIdx, row.value, sourceNode.color, sourceNode.label, targetNode.label)
    );

    // Track final consumption per commodity
    commodityFinalConsumption[commodityNodeId] =
      (commodityFinalConsumption[commodityNodeId] ?? 0) + row.value;
  }

  // Sum all final consumption for totalConsumption
  // Use "Final consumption" sector rows if available, otherwise sum sector totals
  const finalConsumptionRows = consumptionRows.filter(
    (r) => r.sector === "Final consumption" && r.subSector == null && r.value > 0
  );

  if (finalConsumptionRows.length > 0) {
    totalConsumption = finalConsumptionRows.reduce((sum, r) => sum + r.value, 0);
  } else {
    totalConsumption = Object.values(commodityFinalConsumption).reduce((sum, v) => sum + v, 0);
  }

  // ── Step 3: Build transformation links ─────────────────────────────

  // Crude Oil -> Oil Products (total crude oil supply goes to refining)
  const crudeOilTotal = commoditySupply["crude_oil"] ?? 0;
  if (crudeOilTotal > 0) {
    const crudeIdx = nodeIndex["crude_oil"];
    const oilProdIdx = nodeIndex["oil_products"];
    links.push(
      makeLink(
        crudeIdx,
        oilProdIdx,
        crudeOilTotal,
        nodes[crudeIdx].color,
        nodes[crudeIdx].label,
        nodes[oilProdIdx].label
      )
    );
  }

  // Primary fuels -> Electricity Generation
  // For fuels that also have direct final consumption, subtract that amount
  const elecGenIdx = nodeIndex["electricity_gen"];

  for (const fuelId of ELECTRICITY_FUEL_IDS) {
    const supply = commoditySupply[fuelId] ?? 0;
    const directConsumption = commodityFinalConsumption[fuelId] ?? 0;
    const toElecGen = supply - directConsumption;

    if (toElecGen <= 0) continue;

    const fuelIdx = nodeIndex[fuelId];
    links.push(
      makeLink(
        fuelIdx,
        elecGenIdx,
        toElecGen,
        nodes[fuelIdx].color,
        nodes[fuelIdx].label,
        nodes[elecGenIdx].label
      )
    );
  }

  // Electricity Generation -> Electricity (use final electricity consumption as proxy)
  const elecFinalConsumption = commodityFinalConsumption["electricity"] ?? 0;
  if (elecFinalConsumption > 0) {
    const elecIdx = nodeIndex["electricity"];
    links.push(
      makeLink(
        elecGenIdx,
        elecIdx,
        elecFinalConsumption,
        nodes[elecGenIdx].color,
        nodes[elecGenIdx].label,
        nodes[elecIdx].label
      )
    );
  }

  // ── Step 4: Filter out any zero-value links that slipped through ───

  const filteredLinks = links.filter((link) => link.value > 0);

  return {
    nodes,
    links: filteredLinks,
    unit,
    year,
    totalSupply,
    totalConsumption,
  };
}

// ─── PetaJoules conversion ──────────────────────────────────────────────

/**
 * Convert an array of mapped rows from KToE to PetaJoules by multiplying
 * all values by the KTOE_TO_PJ conversion factor.
 *
 * @param {Array} rows - Mapped rows with values in KToE
 * @returns {Array}    - New array with values in PetaJoules
 */
function convertRowsToPJ(rows) {
  return rows.map((row) => ({
    ...row,
    value: row.value * KTOE_TO_PJ,
  }));
}

// ─── File I/O helpers ───────────────────────────────────────────────────

/**
 * Write a SankeyData object to a JSON file.
 */
function writeJsonFile(filepath, data) {
  writeFileSync(filepath, JSON.stringify(data, null, 2), "utf-8");
}

// ─── Main ───────────────────────────────────────────────────────────────

function main() {
  console.log("\n=== India Energy Sankey Data Generator (Self-Contained) ===\n");
  console.log("  Supply data:       Embedded for all 12 years (verified from MoSPI API)");
  console.log("  Consumption data:  Embedded for 2023-24, overrides/estimated for others");
  console.log(`  Conversion:        1 KToE = ${KTOE_TO_PJ} PetaJoules\n`);

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`  Created output directory: ${OUTPUT_DIR}`);
  }

  // Ensure raw-data directory exists (for optional overrides file)
  if (!existsSync(RAW_DATA_DIR)) {
    mkdirSync(RAW_DATA_DIR, { recursive: true });
  }

  // Try to load consumption overrides
  const consumptionOverrides = loadConsumptionOverrides();
  const overrideYears = Object.keys(consumptionOverrides);
  if (overrideYears.length > 0) {
    console.log(`  Override years: ${overrideYears.sort().join(", ")}\n`);
  } else {
    console.log(`  No consumption overrides file found; will estimate missing years.\n`);
  }

  // ── Generate output for each year x unit combination ──────────────

  const totalExpected = ENERGY_YEARS.length * 2; // 12 years x 2 units
  let successCount = 0;
  let failCount = 0;
  const failures = [];

  // Track consumption source for summary
  const consumptionSources = {};

  for (const year of ENERGY_YEARS) {
    // ── Build supply rows from embedded data ──────────────────────
    const supplyRows = supplyDataToRows(year);

    if (supplyRows.length === 0) {
      console.log(`  SKIP  ${year} - no embedded supply data`);
      failCount += 2;
      failures.push({ year, unit: "both", error: "No supply data" });
      continue;
    }

    // ── Get consumption data (embedded -> overrides -> estimated) ──
    const { data: consumptionMap, source: consumptionSource } = getConsumptionForYear(year, consumptionOverrides);
    consumptionSources[year] = consumptionSource;

    const consumptionRows = consumptionDataToRows(year, consumptionMap);

    // ── KToE output ─────────────────────────────────────────────

    const ktoeFilename = `energy-sankey-${year}-ktoe.json`;
    const ktoeFilepath = join(OUTPUT_DIR, ktoeFilename);

    try {
      const ktoeData = transformEnergyBalance(supplyRows, consumptionRows, "KToE", year);
      writeJsonFile(ktoeFilepath, ktoeData);
      console.log(
        `  OK    ${year} KToE        -> ${ktoeFilename} ` +
        `(${ktoeData.links.length} flows, supply: ${Math.round(ktoeData.totalSupply).toLocaleString()}, ` +
        `consumption: ${Math.round(ktoeData.totalConsumption).toLocaleString()}) ` +
        `[consumption: ${consumptionSource}]`
      );
      successCount++;
    } catch (err) {
      console.log(`  FAIL  ${year} KToE        -> ${err.message}`);
      failures.push({ year, unit: "KToE", error: err.message });
      failCount++;
    }

    // ── PetaJoules output ───────────────────────────────────────

    const pjFilename = `energy-sankey-${year}-petajoules.json`;
    const pjFilepath = join(OUTPUT_DIR, pjFilename);

    try {
      const pjSupply = convertRowsToPJ(supplyRows);
      const pjConsumption = convertRowsToPJ(consumptionRows);
      const pjData = transformEnergyBalance(pjSupply, pjConsumption, "PetaJoules", year);
      writeJsonFile(pjFilepath, pjData);
      console.log(
        `  OK    ${year} PetaJoules  -> ${pjFilename} ` +
        `(${pjData.links.length} flows, supply: ${Math.round(pjData.totalSupply).toLocaleString()}, ` +
        `consumption: ${Math.round(pjData.totalConsumption).toLocaleString()})`
      );
      successCount++;
    } catch (err) {
      console.log(`  FAIL  ${year} PetaJoules  -> ${err.message}`);
      failures.push({ year, unit: "PetaJoules", error: err.message });
      failCount++;
    }
  }

  // ── Summary ───────────────────────────────────────────────────────

  console.log(`\n=== Summary ===`);
  console.log(`  Total expected:  ${totalExpected} files (${ENERGY_YEARS.length} years x 2 units)`);
  console.log(`  Succeeded:       ${successCount}`);
  console.log(`  Failed:          ${failCount}`);

  console.log(`\n  Consumption data sources:`);
  for (const year of ENERGY_YEARS) {
    const src = consumptionSources[year] || "n/a";
    console.log(`    ${year}: ${src}`);
  }

  if (failures.length > 0) {
    console.log(`\n  Failed combinations:`);
    for (const f of failures) {
      console.log(`    - ${f.year} ${f.unit}: ${f.error}`);
    }
  }

  console.log(`\n  Output directory: ${OUTPUT_DIR}`);
  console.log("");

  // Exit with error code if everything failed
  if (successCount === 0 && failCount > 0) {
    console.error("ERROR: No files were generated. Check the failures above.");
    process.exit(1);
  }

  if (failCount > 0) {
    console.warn("WARNING: Some files failed to generate. Check the failures above.");
    process.exit(2);
  }

  console.log("All 24 files generated successfully.");
}

main();
