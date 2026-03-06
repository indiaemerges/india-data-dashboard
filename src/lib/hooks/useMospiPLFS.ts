import { useQuery } from "@tanstack/react-query";
import type {
  PLFSAnnualData,
  PLFSQuarterlyData,
  PLFSQuarterPoint,
  PLFSWagesData,
  DataSeries,
} from "@/lib/api/types";

const BASE_PATH = "/india-data-dashboard";

/**
 * Hook to load pre-fetched MoSPI PLFS (Periodic Labour Force Survey) data.
 *
 * All data is pre-generated as a static JSON file under public/data/mospi/,
 * avoiding CORS issues with the MoSPI API (which blocks browser requests).
 */
export function usePLFSAnnualData() {
  return useQuery<PLFSAnnualData>({
    queryKey: ["mospi", "plfs", "annual"],
    queryFn: async () => {
      const url = `${BASE_PATH}/data/mospi/plfs-annual.json`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("PLFS data not available");
      }

      const text = await response.text();
      try {
        return JSON.parse(text) as PLFSAnnualData;
      } catch {
        throw new Error("PLFS data returned invalid format");
      }
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });
}

/**
 * Convert a PLFS indicator (lfpr/wpr/ur) into DataSeries[] by gender.
 */
export function plfsGenderSeries(
  data: PLFSAnnualData,
  indicator: "lfpr" | "wpr" | "ur",
  genders: ("male" | "female" | "person")[]
): DataSeries[] {
  const labels: Record<string, string> = {
    lfpr: "LFPR",
    wpr: "WPR",
    ur: "Unemployment Rate",
  };
  const genderLabels: Record<string, string> = {
    male: "Male",
    female: "Female",
    person: "Overall",
  };

  const source = data[indicator];

  return genders.map((g) => ({
    source: "mospi" as const,
    indicator: `${labels[indicator]} — ${genderLabels[g]}`,
    indicatorId: `PLFS_${indicator}_${g}`,
    unit: "%",
    frequency: "annual" as const,
    data: data.years.map((year, i) => ({
      date: year,
      value: source[g]?.[i] ?? null,
    })),
    metadata: {
      lastUpdated: data.lastUpdated,
      sourceUrl: "https://www.mospi.gov.in/",
      notes: "PS+SS status, age 15+, All India",
    },
  }));
}

/**
 * Hook to load pre-fetched MoSPI PLFS Quarterly Bulletin data.
 *
 * Data is urban-only for most quarters (2017-18 to 2023-24).
 * Rural and rural+urban data available from 2024-25 Q1 onwards.
 */
export function usePLFSQuarterlyData() {
  return useQuery<PLFSQuarterlyData>({
    queryKey: ["mospi", "plfs", "quarterly"],
    queryFn: async () => {
      const url = `${BASE_PATH}/data/mospi/plfs-quarterly.json`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("PLFS quarterly data not available");
      }

      const text = await response.text();
      try {
        return JSON.parse(text) as PLFSQuarterlyData;
      } catch {
        throw new Error("PLFS quarterly data returned invalid format");
      }
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });
}

type PLFSIndicator = "lfpr" | "wpr" | "ur";
type PLFSGender = "male" | "female" | "person";
type PLFSSector = "urban" | "rural" | "combined";

const INDICATOR_LABELS: Record<PLFSIndicator, string> = {
  lfpr: "LFPR",
  wpr: "WPR",
  ur: "Unemployment Rate",
};

const GENDER_LABELS: Record<PLFSGender, string> = {
  male: "Male",
  female: "Female",
  person: "Overall",
};

const SECTOR_LABELS: Record<PLFSSector, string> = {
  urban: "Urban",
  rural: "Rural",
  combined: "All India",
};

/**
 * Convert quarterly PLFS data into DataSeries[] for a specific indicator,
 * sector, and gender subset.
 *
 * Only quarters that have non-null values for the requested sector are included.
 *
 * @example
 * // Urban unemployment rate for all genders
 * plfsQuarterlySeries(data, "ur", "urban", ["male", "female", "person"])
 */
export function plfsQuarterlySeries(
  data: PLFSQuarterlyData,
  indicator: PLFSIndicator,
  sector: PLFSSector,
  genders: PLFSGender[]
): DataSeries[] {
  return genders.map((gender) => {
    const points: { date: string; value: number | null }[] = [];

    for (const q of data.quarters) {
      const sectorData = q[indicator][sector];
      if (sectorData === null) continue; // sector not released for this quarter
      points.push({ date: q.date, value: sectorData[gender] });
    }

    return {
      source: "mospi" as const,
      indicator: `${INDICATOR_LABELS[indicator]} — ${GENDER_LABELS[gender]} (${SECTOR_LABELS[sector]})`,
      indicatorId: `PLFS_quarterly_${indicator}_${sector}_${gender}`,
      unit: "%",
      frequency: "quarterly" as const,
      data: points.map(({ date, value }) => ({ date, value })),
      metadata: {
        lastUpdated: data.lastUpdated,
        sourceUrl: data.sourceUrl,
        notes: "PLFS Quarterly Bulletin, PS+SS status, age 15+",
      },
    };
  });
}

/**
 * Get the latest quarter from the dataset where the given sector has data.
 */
export function plfsLatestQuarter(
  data: PLFSQuarterlyData,
  sector: PLFSSector = "urban"
): PLFSQuarterPoint | null {
  const relevant = [...data.quarters]
    .reverse()
    .find((q) => q.ur[sector] !== null);
  return relevant ?? null;
}

// ── PLFS Wages & Worker Distribution ──────────────────────────────────────

/**
 * Load pre-fetched PLFS wages and worker distribution data
 * (All India, rural+urban, PS+SS, annual averages from PLFS annual report).
 */
export function usePLFSWagesData() {
  return useQuery<PLFSWagesData>({
    queryKey: ["mospi", "plfs", "wages"],
    queryFn: async () => {
      const url = `${BASE_PATH}/data/mospi/plfs-wages.json`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("PLFS wages data not available");
      const text = await response.text();
      try {
        return JSON.parse(text) as PLFSWagesData;
      } catch {
        throw new Error("PLFS wages data returned invalid format");
      }
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });
}

type WagesGender = "male" | "female" | "person";
const GENDER_WAGE_LABELS: Record<WagesGender, string> = {
  male: "Male", female: "Female", person: "Overall",
};

/**
 * Build DataSeries[] for a wages/earnings indicator across genders.
 * Casual wages are converted from ₹/day to ₹/month (×26 working days).
 */
export function plfsWagesSeries(
  data: PLFSWagesData,
  type: "regular" | "casual" | "selfEmp",
  genders: WagesGender[] = ["male", "female", "person"]
): DataSeries[] {
  const CFG = {
    regular: {
      src: data.regularWages,
      label: "Regular Wage",
      unit: "₹ / month",
      scale: 1,
      notes: "Average monthly earnings from salaried employment",
    },
    casual: {
      src: data.casualWages,
      label: "Casual Daily Wage",
      unit: "₹ / day",
      scale: 1,
      notes: "Average daily earnings from casual labour work",
    },
    selfEmp: {
      src: data.selfEmpEarnings,
      label: "Self-Employment Earnings",
      unit: "₹ / month",
      scale: 1,
      notes: "Average gross earnings from self-employment (30-day period)",
    },
  };

  const { src, label, unit, scale, notes } = CFG[type];
  return genders.map((g) => ({
    source: "mospi" as const,
    indicator: `${label} — ${GENDER_WAGE_LABELS[g]}`,
    indicatorId: `PLFS_wages_${type}_${g}`,
    unit,
    frequency: "annual" as const,
    data: src.years.map((year, i) => ({
      date: year,
      value: src[g]?.[i] != null ? Math.round((src[g][i] as number) * scale) : null,
    })),
    metadata: {
      lastUpdated: data.lastUpdated,
      sourceUrl: data.sourceUrl,
      notes,
    },
  }));
}

/**
 * Build DataSeries[] for worker distribution (% share) by employment status.
 * Returns 3 series: Self-Employed, Regular Wage, Casual Labour.
 */
export function plfsWorkerDistSeries(
  data: PLFSWagesData,
  gender: WagesGender = "person"
): DataSeries[] {
  const dist = data.workerDist;
  const categories: Array<{ key: keyof typeof dist; label: string }> = [
    { key: "selfEmployed", label: "Self-Employed" },
    { key: "regularWage",  label: "Regular Wage / Salaried" },
    { key: "casualLabour", label: "Casual Labour" },
  ];

  return categories.map(({ key, label }) => ({
    source: "mospi" as const,
    indicator: label,
    indicatorId: `PLFS_dist_${key}_${gender}`,
    unit: "%",
    frequency: "annual" as const,
    data: dist.years.map((year, i) => ({
      date: year,
      value: (dist[key] as Record<WagesGender, number[]>)[gender]?.[i] ?? null,
    })),
    metadata: {
      lastUpdated: data.lastUpdated,
      sourceUrl: data.sourceUrl,
      notes: "% of all workers, PS+SS status, age 15+, All India rural+urban",
    },
  }));
}

/**
 * Convert UR rural/urban breakdown into DataSeries[].
 */
export function plfsUrSectorSeries(data: PLFSAnnualData): DataSeries[] {
  const sectors = ["rural", "urban"] as const;
  const labels: Record<string, string> = {
    rural: "Rural",
    urban: "Urban",
  };

  return sectors.map((s) => ({
    source: "mospi" as const,
    indicator: `UR — ${labels[s]}`,
    indicatorId: `PLFS_ur_${s}`,
    unit: "%",
    frequency: "annual" as const,
    data: data.years.map((year, i) => ({
      date: year,
      value: data.ur[s]?.[i] ?? null,
    })),
    metadata: {
      lastUpdated: data.lastUpdated,
      sourceUrl: "https://www.mospi.gov.in/",
      notes: "PS+SS status, age 15+, All India",
    },
  }));
}
