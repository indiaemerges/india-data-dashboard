// MoSPI Energy Balance API client
// Dataset: ENERGY from eSankhyiki (api.mospi.gov.in)
// No API key required

import type { EnergyBalanceRow, EnergyUnit } from "./types";

const MOSPI_BASE_URL = "https://api.mospi.gov.in/publisher/api/fetchData";

// ─── Code mappings ────────────────────────────────────────────────────

/** Map EnergyUnit to API indicator_code */
const UNIT_CODES: Record<EnergyUnit, string> = {
  KToE: "1",
  PetaJoules: "2",
};

/** All commodity codes (Coal, Crude Oil, Oil Products, Natural Gas, Nuclear, Hydro, Solar/Wind/Others, Electricity, Lignite) */
export const COMMODITY_CODES = "1,2,3,4,5,6,7,8,9";

/** Supply-side sector codes: Production, Imports, Exports, Stock changes, Total primary energy supply */
const SUPPLY_SECTOR_CODES = "5,6,7,8,9";

/** Consumption-side sector codes: Industry, Transport, Others, Non-energy use, Final consumption */
const CONSUMPTION_SECTOR_CODES = "1,2,3,4,10";

/** Map commodity display name (from API response) to numeric code */
const COMMODITY_NAME_TO_CODE: Record<string, number> = {
  Coal: 1,
  "Crude Oil": 2,
  "Oil Products": 3,
  "Natural Gas": 4,
  Nuclear: 5,
  Hydro: 6,
  "Solar, Wind, Others": 7,
  Electricity: 8,
  Lignite: 9,
};

/** Map sector display name (from API response) to numeric code (supply side) */
const SUPPLY_SECTOR_NAME_TO_CODE: Record<string, number> = {
  Production: 5,
  Imports: 6,
  Exports: 7,
  "Stock changes": 8,
  "Total primary energy supply": 9,
};

/** Map sector display name (from API response) to numeric code (consumption side) */
const CONSUMPTION_SECTOR_NAME_TO_CODE: Record<string, number> = {
  Industry: 1,
  Transport: 2,
  Others: 3,
  "Non-energy use": 4,
  "Final consumption": 10,
};

/** Combined sector name-to-code mapping for general use */
const SECTOR_NAME_TO_CODE: Record<string, number> = {
  ...SUPPLY_SECTOR_NAME_TO_CODE,
  ...CONSUMPTION_SECTOR_NAME_TO_CODE,
};

// ─── API response types ───────────────────────────────────────────────

interface MospiApiResponse {
  data: MospiApiRow[] | null;
  meta_data: {
    page: number;
    totalRecords: number;
    totalPages: number;
    recordPerPage: number;
  };
  msg: string;
  statusCode: boolean;
}

interface MospiApiRow {
  year: string;
  indicator: string;
  use_of_energy_balance: string;
  energy_commodities: string;
  energy_sub_commodities: string | null;
  end_use_sector: string;
  end_use_sub_sector: string | null;
  value: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────

/**
 * Build the full MoSPI API URL with query parameters.
 */
function buildUrl(params: Record<string, string>): string {
  const searchParams = new URLSearchParams({
    ...params,
    Format: "JSON",
  });
  return `${MOSPI_BASE_URL}?${searchParams.toString()}`;
}

/**
 * Map a raw MoSPI API row to our normalised EnergyBalanceRow type.
 */
function mapRow(row: MospiApiRow): EnergyBalanceRow {
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

/**
 * Fetch a single page from the MoSPI API.
 */
async function fetchPage(
  params: Record<string, string>
): Promise<MospiApiResponse> {
  const url = buildUrl(params);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `MoSPI API error: ${response.status} ${response.statusText}`
    );
  }

  const json: MospiApiResponse = await response.json();

  if (!json.statusCode) {
    throw new Error(`MoSPI API returned error: ${json.msg}`);
  }

  return json;
}

/**
 * Fetch all pages for a given set of parameters.
 * The MoSPI API defaults to 10 records per page, so we use limit=200
 * and paginate if totalPages > 1.
 */
async function fetchAllPages(
  baseParams: Record<string, string>
): Promise<MospiApiRow[]> {
  const params = { ...baseParams, limit: "200", page: "1" };
  const firstPage = await fetchPage(params);
  const rows: MospiApiRow[] = firstPage.data ?? [];
  const { totalPages } = firstPage.meta_data;

  if (totalPages > 1) {
    // Fetch remaining pages in parallel
    const pagePromises: Promise<MospiApiResponse>[] = [];
    for (let p = 2; p <= totalPages; p++) {
      pagePromises.push(fetchPage({ ...params, page: String(p) }));
    }
    const pages = await Promise.all(pagePromises);
    for (const page of pages) {
      if (page.data) {
        rows.push(...page.data);
      }
    }
  }

  return rows;
}

// ─── Public API ───────────────────────────────────────────────────────

/**
 * Fetch energy supply data (Production, Imports, Exports, Stock changes, TPES)
 * for a given fiscal year and unit.
 */
export async function fetchEnergySupply(
  year: string,
  unit: EnergyUnit
): Promise<EnergyBalanceRow[]> {
  const rows = await fetchAllPages({
    indicator_code: UNIT_CODES[unit],
    use_of_energy_balance_code: "1",
    year,
    energy_commodities_code: COMMODITY_CODES,
    end_use_sector_code: SUPPLY_SECTOR_CODES,
  });

  return rows.map(mapRow);
}

/**
 * Fetch energy consumption data (Industry, Transport, Others, Non-energy use, Final consumption)
 * for a given fiscal year and unit.
 * Consumption may have 500+ rows, so pagination is handled automatically.
 */
export async function fetchEnergyConsumption(
  year: string,
  unit: EnergyUnit
): Promise<EnergyBalanceRow[]> {
  const rows = await fetchAllPages({
    indicator_code: UNIT_CODES[unit],
    use_of_energy_balance_code: "2",
    year,
    energy_commodities_code: COMMODITY_CODES,
    end_use_sector_code: CONSUMPTION_SECTOR_CODES,
  });

  return rows.map(mapRow);
}

/**
 * Fetch both supply and consumption in parallel, returning both arrays.
 */
export async function fetchEnergyBalance(
  year: string,
  unit: EnergyUnit
): Promise<{
  supply: EnergyBalanceRow[];
  consumption: EnergyBalanceRow[];
}> {
  const [supply, consumption] = await Promise.all([
    fetchEnergySupply(year, unit),
    fetchEnergyConsumption(year, unit),
  ]);

  return { supply, consumption };
}
