// Common data types shared across all API clients and chart components

export interface DataPoint {
  date: string; // ISO date, fiscal year "2023-24", or label
  value: number | null;
  label?: string; // For categorical data (e.g., state name, sector)
}

export interface DataSeries {
  source: "worldbank" | "mospi" | "datagov" | "census" | "rbi" | "ppac";
  indicator: string; // Human-readable indicator name
  indicatorId?: string; // Machine-readable ID (e.g., "NY.GDP.MKTP.KD.ZG")
  unit: string; // e.g., "%" , "USD", "INR Crore", "Index"
  frequency: "annual" | "quarterly" | "monthly" | "daily";
  data: DataPoint[];
  metadata: {
    lastUpdated: string;
    sourceUrl: string;
    notes?: string;
  };
}

export interface FilterOption {
  id: string | number;
  label: string;
}

export interface DatasetFilters {
  [key: string]: FilterOption[];
}

// API response status
export interface ApiResponse<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// MoSPI-specific types
export type MospiDataset =
  | "PLFS"
  | "CPI"
  | "IIP"
  | "ASI"
  | "NAS"
  | "WPI"
  | "ENERGY";

export interface MospiIndicator {
  code: number;
  name: string;
  unit?: string;
  viz?: string; // Suggested visualization type
}

// World Bank specific types
export interface WorldBankIndicatorMeta {
  id: string;
  name: string;
  sourceNote: string;
}

export interface WorldBankDataPoint {
  indicator: { id: string; value: string };
  country: { id: string; value: string };
  date: string;
  value: number | null;
}

// ─── Energy Sankey types ───────────────────────────────────────────────

/** Unit of energy measurement */
export type EnergyUnit = "KToE" | "PetaJoules";

/** Available fiscal years in the MoSPI Energy dataset (newest first) */
export const ENERGY_YEARS = [
  "2023-24",
  "2022-23",
  "2021-22",
  "2020-21",
  "2019-20",
  "2018-19",
  "2017-18",
  "2016-17",
  "2015-16",
  "2014-15",
  "2013-14",
  "2012-13",
] as const;

export type EnergyYear = (typeof ENERGY_YEARS)[number];

/** Raw row returned by MoSPI Energy Balance API */
export interface EnergyBalanceRow {
  year: string;
  commodity: string;
  commodityCode: number;
  sector: string;
  sectorCode: number;
  subSector?: string;
  subSectorCode?: number;
  value: number;
}

/** A node in the Sankey diagram */
export interface SankeyNode {
  id: string; // Unique machine key (e.g., "coal", "electricity_gen")
  label: string; // Display label (e.g., "Coal", "Electricity Generation")
  color: string; // RGBA color string
  column: number; // 0-based column for x positioning (0=source, 1=primary, 2=transform, 3=end-use)
}

/** A link (flow) in the Sankey diagram */
export interface SankeyLink {
  source: number; // Index into SankeyNode[]
  target: number; // Index into SankeyNode[]
  value: number; // Energy value in selected unit
  color: string; // RGBA color string (semi-transparent)
  label: string; // Hover label (e.g., "Coal → Industry: 200,947 KToE")
}

/** Complete data for rendering a Sankey diagram */
export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
  unit: EnergyUnit;
  year: string;
  totalSupply: number;
  totalConsumption: number;
}

// ─── IIP (Index of Industrial Production) types ────────────────────────

/** Available IIP fiscal years (newest first) */
export const IIP_YEARS = [
  "2024-25",
  "2023-24",
  "2022-23",
  "2021-22",
  "2020-21",
  "2019-20",
  "2018-19",
  "2017-18",
  "2016-17",
  "2015-16",
  "2014-15",
  "2013-14",
  "2012-13",
] as const;

export type IIPYear = (typeof IIP_YEARS)[number];

/** IIP category data point — parallel arrays aligned with `years` */
export interface IIPCategoryData {
  index: number[]; // Index values for each year
  growth: number[]; // Growth rate (%) for each year
}

/** Complete IIP annual dataset (loaded from static JSON) */
export interface IIPAnnualData {
  baseYear: string;
  lastUpdated: string;
  years: string[];
  sectoral: Record<string, IIPCategoryData>;
  useBased: Record<string, IIPCategoryData>;
}

// ─── PLFS (Periodic Labour Force Survey) types ─────────────────────────

/** Gender breakdown: male, female, person (total) */
export interface PLFSGenderData {
  male: number[];
  female: number[];
  person: number[];
}

/** Unemployment rate with additional rural/urban breakdown */
export interface PLFSUnemploymentData extends PLFSGenderData {
  rural: number[];
  urban: number[];
}

/** Complete PLFS annual dataset (loaded from static JSON) */
export interface PLFSAnnualData {
  lastUpdated: string;
  notes: string;
  years: string[];
  lfpr: PLFSGenderData;
  wpr: PLFSGenderData;
  ur: PLFSUnemploymentData;
}

// ---------------------------------------------------------------------------
// RBI Key Rates types
// ---------------------------------------------------------------------------

/** RBI key policy rates and reserve requirements (annual end-of-year, static JSON) */
export interface RBIKeyRatesData {
  lastUpdated: string;
  notes: string;
  years: string[];
  repoRate: (number | null)[];
  reverseRepoSDF: (number | null)[];
  crr: (number | null)[];
  slr: (number | null)[];
}
