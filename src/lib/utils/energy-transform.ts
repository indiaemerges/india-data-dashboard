/**
 * Transforms flat MoSPI Energy Balance API rows into SankeyData
 * for rendering India's energy flow Sankey diagram.
 */

import type {
  EnergyBalanceRow,
  EnergyUnit,
  SankeyData,
  SankeyLink,
  SankeyNode,
} from "@/lib/api/types";

// ─── Fixed Sankey node definitions (16 nodes) ──────────────────────────

export const SANKEY_NODES: SankeyNode[] = [
  // Column 0 — Sources
  { id: "production", label: "Production", color: "rgba(255,153,51,0.8)", column: 0 },
  { id: "imports", label: "Imports", color: "rgba(0,0,128,0.8)", column: 0 },

  // Column 1 — Primary Energy
  { id: "coal", label: "Coal", color: "rgba(74,74,74,0.8)", column: 1 },
  { id: "crude_oil", label: "Crude Oil", color: "rgba(139,69,19,0.8)", column: 1 },
  { id: "natural_gas", label: "Natural Gas", color: "rgba(135,206,235,0.8)", column: 1 },
  { id: "hydro", label: "Hydro", color: "rgba(70,130,180,0.8)", column: 1 },
  { id: "nuclear", label: "Nuclear", color: "rgba(255,99,71,0.8)", column: 1 },
  { id: "solar_wind_others", label: "Solar/Wind/Others", color: "rgba(255,215,0,0.8)", column: 1 },
  { id: "lignite", label: "Lignite", color: "rgba(160,82,45,0.8)", column: 1 },

  // Column 2 — Transformation
  { id: "oil_products", label: "Oil Products", color: "rgba(210,105,30,0.8)", column: 2 },
  { id: "electricity_gen", label: "Electricity Generation", color: "rgba(241,196,15,0.8)", column: 2 },
  { id: "electricity", label: "Electricity", color: "rgba(241,196,15,0.8)", column: 2 },

  // Column 3 — End-Use Sectors
  { id: "industry", label: "Industry", color: "rgba(255,153,51,0.6)", column: 3 },
  { id: "transport", label: "Transport", color: "rgba(155,89,182,0.6)", column: 3 },
  { id: "others", label: "Others", color: "rgba(46,204,113,0.6)", column: 3 },
  { id: "non_energy_use", label: "Non-energy Use", color: "rgba(52,152,219,0.6)", column: 3 },
];

/** Mapping from node id to its index in SANKEY_NODES */
export const nodeIndex: Record<string, number> = Object.fromEntries(
  SANKEY_NODES.map((node, i) => [node.id, i])
);

// ─── Internal helpers ───────────────────────────────────────────────────

/** Normalize MoSPI commodity names to our node ids */
function commodityToNodeId(commodity: string): string | null {
  const map: Record<string, string> = {
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

/** Normalize MoSPI end-use sector names to our node ids */
function sectorToNodeId(sector: string): string | null {
  const map: Record<string, string> = {
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
  "coal",
  "lignite",
  "natural_gas",
  "hydro",
  "nuclear",
  "solar_wind_others",
]);

/** Replace the alpha channel of an RGBA color string */
function withAlpha(rgba: string, alpha: number): string {
  return rgba.replace(/[\d.]+\)$/, `${alpha})`);
}

/** Create a link object */
function makeLink(
  source: number,
  target: number,
  value: number,
  sourceColor: string,
  sourceLabel: string,
  targetLabel: string
): SankeyLink {
  return {
    source,
    target,
    value,
    color: withAlpha(sourceColor, 0.3),
    label: `${sourceLabel} \u2192 ${targetLabel}`,
  };
}

// ─── Main transform function ────────────────────────────────────────────

/**
 * Transform flat MoSPI Energy Balance API rows into a complete SankeyData
 * object for rendering the Sankey diagram.
 *
 * @param supplyRows   Rows from the Supply side (use_of_energy_balance_code = 1):
 *                     sectors include Production, Imports, Exports, Stock changes, TPES
 * @param consumptionRows  Rows from the Consumption side (use_of_energy_balance_code = 2):
 *                         sectors include Industry, Transport, Others, Non-energy use,
 *                         Final consumption
 * @param unit         Energy unit ("KToE" or "PetaJoules")
 * @param year         Fiscal year string (e.g., "2023-24")
 */
export function transformEnergyBalance(
  supplyRows: EnergyBalanceRow[],
  consumptionRows: EnergyBalanceRow[],
  unit: EnergyUnit,
  year: string
): SankeyData {
  const nodes = [...SANKEY_NODES];
  const links: SankeyLink[] = [];

  // Track totals per commodity for transformation links
  const commoditySupply: Record<string, number> = {};
  // Track how much of each commodity goes to final consumption (for electricity split)
  const commodityFinalConsumption: Record<string, number> = {};

  let totalSupply = 0;
  let totalConsumption = 0;

  // ── Step 1: Build supply links (Source -> Primary Energy) ──────────

  for (const row of supplyRows) {
    if (row.value <= 0) continue;

    const commodityNodeId = commodityToNodeId(row.commodity);
    if (!commodityNodeId) continue;

    const commodityIdx = nodeIndex[commodityNodeId];
    if (commodityIdx === undefined) continue;

    let sourceNodeId: string | null = null;
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

    // Skip Crude Oil consumption rows — crude oil goes through Oil Products
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
  let totalElecGenInput = 0;

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
    totalElecGenInput += toElecGen;
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
