// World Bank API v2 client
// Docs: https://datahelpdesk.worldbank.org/knowledgebase/articles/889392
// No API key required

import type { DataSeries, WorldBankDataPoint } from "./types";

const BASE_URL = "https://api.worldbank.org/v2";

/**
 * Fetch a single indicator for India from the World Bank API.
 * Returns normalized DataSeries format.
 */
export async function fetchWorldBankIndicator(
  indicatorId: string,
  years: number = 30,
  countryCode: string = "IND"
): Promise<DataSeries> {
  const url = `${BASE_URL}/country/${countryCode}/indicator/${indicatorId}?format=json&per_page=${years}&date=1990:2025`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `World Bank API error: ${response.status} ${response.statusText}`
    );
  }

  const json = await response.json();

  // World Bank API returns [paginationMeta, dataArray]
  if (!Array.isArray(json) || json.length < 2 || !Array.isArray(json[1])) {
    throw new Error("Unexpected World Bank API response format");
  }

  const [meta, rawData] = json as [
    { page: number; pages: number; per_page: number; total: number; lastupdated: string },
    WorldBankDataPoint[],
  ];

  // Filter out null values and sort by date ascending
  const validData = rawData
    .filter((d) => d.value !== null)
    .sort((a, b) => parseInt(a.date) - parseInt(b.date));

  if (validData.length === 0) {
    throw new Error(`No data found for indicator ${indicatorId}`);
  }

  // Extract indicator name from first data point
  const indicatorName = validData[0]?.indicator?.value || indicatorId;

  return {
    source: "worldbank",
    indicator: indicatorName,
    indicatorId,
    unit: guessUnit(indicatorId, indicatorName),
    frequency: "annual",
    data: validData.map((d) => ({
      date: d.date,
      value: d.value,
    })),
    metadata: {
      lastUpdated: meta.lastupdated || new Date().toISOString(),
      sourceUrl: `https://data.worldbank.org/indicator/${indicatorId}?locations=IN`,
    },
  };
}

/**
 * Fetch multiple indicators for India in parallel.
 */
export async function fetchWorldBankIndicators(
  indicatorIds: string[],
  years: number = 30
): Promise<DataSeries[]> {
  const promises = indicatorIds.map((id) =>
    fetchWorldBankIndicator(id, years).catch((err) => {
      console.warn(`Failed to fetch ${id}:`, err.message);
      return null;
    })
  );

  const results = await Promise.all(promises);
  return results.filter((r): r is DataSeries => r !== null);
}

// Common World Bank indicator IDs for India
export const WORLD_BANK_INDICATORS = {
  // GDP & Growth
  GDP_CURRENT_USD: "NY.GDP.MKTP.CD",
  GDP_GROWTH: "NY.GDP.MKTP.KD.ZG",
  GDP_PER_CAPITA: "NY.GDP.PCAP.CD",
  GDP_PER_CAPITA_GROWTH: "NY.GDP.PCAP.KD.ZG",
  GNI_PER_CAPITA_ATLAS: "NY.GNP.PCAP.CD",

  // Trade
  EXPORTS_GDP_PCT: "NE.EXP.GNFS.ZS",
  IMPORTS_GDP_PCT: "NE.IMP.GNFS.ZS",
  TRADE_BALANCE_GDP_PCT: "NE.RSB.GNFS.ZS",
  FDI_NET_INFLOWS_GDP: "BX.KLT.DINV.WD.GD.ZS",
  CURRENT_ACCOUNT_GDP: "BN.CAB.XOKA.GD.ZS",

  // Population
  POPULATION: "SP.POP.TOTL",
  POPULATION_GROWTH: "SP.POP.GROW",
  URBAN_POPULATION_PCT: "SP.URB.TOTL.IN.ZS",
  LIFE_EXPECTANCY: "SP.DYN.LE00.IN",

  // Inflation & Prices
  INFLATION_CPI: "FP.CPI.TOTL.ZG",
  INFLATION_GDP_DEFLATOR: "NY.GDP.DEFL.KD.ZG",

  // Development
  POVERTY_RATIO: "SI.POV.DDAY",
  GINI_INDEX: "SI.POV.GINI",
  HDI: "HD.HCI.OVRL",

  // Finance
  BROAD_MONEY_GDP: "FM.LBL.BMNY.GD.ZS",
  DOMESTIC_CREDIT_GDP: "FS.AST.PRVT.GD.ZS",
};

/**
 * Guess the unit from indicator ID patterns
 */
function guessUnit(indicatorId: string, name: string): string {
  const lowerName = name.toLowerCase();
  const lowerId = indicatorId.toLowerCase();

  if (lowerId.includes(".zs") || lowerId.includes(".zg") || lowerName.includes("% of gdp") || lowerName.includes("growth")) {
    return "%";
  }
  if (lowerId.includes(".cd") || lowerName.includes("current us$")) {
    return "Current USD";
  }
  if (lowerId.includes(".kd") || lowerName.includes("constant")) {
    return "Constant USD";
  }
  if (lowerName.includes("index")) {
    return "Index";
  }
  if (lowerName.includes("years")) {
    return "Years";
  }
  if (lowerName.includes("population")) {
    return "People";
  }
  return "";
}
