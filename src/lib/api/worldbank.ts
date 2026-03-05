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

  // Trade — % of GDP (openness ratios)
  EXPORTS_GDP_PCT: "NE.EXP.GNFS.ZS",
  IMPORTS_GDP_PCT: "NE.IMP.GNFS.ZS",
  TRADE_BALANCE_GDP_PCT: "NE.RSB.GNFS.ZS",
  FDI_NET_INFLOWS_GDP: "BX.KLT.DINV.WD.GD.ZS",
  CURRENT_ACCOUNT_GDP: "BN.CAB.XOKA.GD.ZS",

  // Trade — absolute USD values (current prices, BoP basis)
  MERCH_EXPORTS_USD: "TX.VAL.MRCH.CD.WT",       // Merchandise exports
  MERCH_IMPORTS_USD: "TM.VAL.MRCH.CD.WT",       // Merchandise imports
  SERVICES_EXPORTS_USD: "BX.GSR.NFSV.CD",       // Service exports
  SERVICES_IMPORTS_USD: "BM.GSR.NFSV.CD",       // Service imports
  FDI_INFLOWS_USD: "BX.KLT.DINV.CD.WD",         // FDI net inflows
  CURRENT_ACCOUNT_USD: "BN.CAB.XOKA.CD",        // Current account balance
  HIGH_TECH_EXPORTS_PCT: "TX.VAL.TECH.MF.ZS",   // High-tech exports (% of mfg exports)

  // Population
  POPULATION: "SP.POP.TOTL",
  POPULATION_GROWTH: "SP.POP.GROW",
  URBAN_POPULATION_PCT: "SP.URB.TOTL.IN.ZS",
  LIFE_EXPECTANCY: "SP.DYN.LE00.IN",

  // Inflation & Prices
  INFLATION_CPI: "FP.CPI.TOTL.ZG",
  INFLATION_GDP_DEFLATOR: "NY.GDP.DEFL.KD.ZG",

  // Poverty & Inequality
  POVERTY_RATIO: "SI.POV.DDAY",
  GINI_INDEX: "SI.POV.GINI",
  HDI: "HD.HCI.OVRL",
  INCOME_SHARE_LOWEST_20: "SI.DST.FRST.20",

  // Finance
  BROAD_MONEY_GDP: "FM.LBL.BMNY.GD.ZS",
  DOMESTIC_CREDIT_GDP: "FS.AST.PRVT.GD.ZS",

  // ── Human Development ────────────────────────────────────────────────────

  // Education
  LITERACY_RATE_ADULT: "SE.ADT.LITR.ZS",
  LITERACY_RATE_FEMALE: "SE.ADT.LITR.FE.ZS",
  LITERACY_RATE_MALE: "SE.ADT.LITR.MA.ZS",
  ENROLLMENT_PRIMARY: "SE.PRM.ENRR",
  ENROLLMENT_SECONDARY: "SE.SEC.ENRR",
  ENROLLMENT_TERTIARY: "SE.TER.ENRR",
  GPI_PRIMARY_SECONDARY: "SE.ENR.PRSC.FM.ZS",

  // Health
  INFANT_MORTALITY: "SP.DYN.IMRT.IN",
  CHILD_MORTALITY_U5: "SH.DYN.MORT",
  MATERNAL_MORTALITY: "SH.STA.MMRT",
  IMMUNIZATION_MEASLES: "SH.IMM.MEAS",
  IMMUNIZATION_DPT: "SH.IMM.IDPT",

  // Gender
  FEMALE_LFPR: "SL.TLF.CACT.FE.ZS",
  MALE_LFPR: "SL.TLF.CACT.MA.ZS",
};

/**
 * Guess the unit from indicator ID patterns
 */
function guessUnit(indicatorId: string, name: string): string {
  const lowerName = name.toLowerCase();
  const lowerId = indicatorId.toLowerCase();

  // Specific overrides for well-known indicators
  if (lowerId === "sp.dyn.imrt.in" || lowerId === "sh.dyn.mort") return "per 1,000";
  if (lowerId === "sh.sta.mmrt") return "per 100,000";

  if (lowerId.includes(".zs") || lowerId.includes(".zg") || lowerName.includes("% of gdp") || lowerName.includes("growth")) {
    return "%";
  }
  if (lowerId.includes(".cd") || lowerName.includes("current us$")) {
    return "Current USD";
  }
  if (lowerId.includes(".kd") || lowerName.includes("constant")) {
    return "Constant USD";
  }
  if (lowerName.includes("index") || lowerName.includes("gini")) {
    return "Index";
  }
  if (lowerName.includes("years") || lowerName.includes("life expectancy")) {
    return "Years";
  }
  if (lowerName.includes("population")) {
    return "People";
  }
  return "";
}
