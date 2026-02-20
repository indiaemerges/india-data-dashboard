import { useQuery } from "@tanstack/react-query";
import { RBIKeyRatesData, DataSeries } from "@/lib/api/types";

const BASE_PATH = "/india-data-dashboard";
const RBI_URL = "https://data.rbi.org.in/DBIE/";

export function useRBIKeyRates() {
  return useQuery<RBIKeyRatesData>({
    queryKey: ["rbi", "key-rates"],
    queryFn: async () => {
      const res = await fetch(`${BASE_PATH}/data/rbi/key-rates.json`);
      if (!res.ok) throw new Error(`Failed to fetch RBI key rates: ${res.status}`);
      return res.json();
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });
}

/**
 * Convert RBI key rates data into DataSeries arrays for charts.
 */
export function rbiRatesToSeries(data: RBIKeyRatesData): DataSeries[] {
  const makePoints = (values: (number | null)[]) =>
    data.years.map((y, i) => ({ date: y, value: values[i] ?? null }));

  const meta = {
    lastUpdated: data.lastUpdated,
    sourceUrl: RBI_URL,
    notes: data.notes,
  };

  return [
    {
      source: "rbi" as const,
      indicator: "Repo Rate",
      indicatorId: "RBI_REPO",
      unit: "%",
      frequency: "annual" as const,
      data: makePoints(data.repoRate),
      metadata: meta,
    },
    {
      source: "rbi" as const,
      indicator: "Reverse Repo / SDF",
      indicatorId: "RBI_SDF",
      unit: "%",
      frequency: "annual" as const,
      data: makePoints(data.reverseRepoSDF),
      metadata: meta,
    },
    {
      source: "rbi" as const,
      indicator: "CRR",
      indicatorId: "RBI_CRR",
      unit: "%",
      frequency: "annual" as const,
      data: makePoints(data.crr),
      metadata: meta,
    },
    {
      source: "rbi" as const,
      indicator: "SLR",
      indicatorId: "RBI_SLR",
      unit: "%",
      frequency: "annual" as const,
      data: makePoints(data.slr),
      metadata: meta,
    },
  ];
}
