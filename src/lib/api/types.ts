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
