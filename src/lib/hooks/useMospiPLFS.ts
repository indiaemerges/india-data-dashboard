import { useQuery } from "@tanstack/react-query";
import type { PLFSAnnualData, DataSeries } from "@/lib/api/types";

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
