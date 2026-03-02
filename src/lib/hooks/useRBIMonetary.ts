import { useQuery } from "@tanstack/react-query";
import {
  RBIKeyRatesData,
  RBIPolicyRatesData,
  RBIForexData,
  DataSeries,
} from "@/lib/api/types";

const BASE_PATH = "/india-data-dashboard";
const RBI_URL = "https://data.rbi.org.in/DBIE/";

// ─────────────────────────────────────────────────────────────────────────────
// Legacy hook (annual key-rates.json — kept for compatibility)
// ─────────────────────────────────────────────────────────────────────────────

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
 * @deprecated Use useRBIPolicyRates() + rbiPolicyRatesToSeries()
 * Convert RBI annual key rates data into DataSeries arrays for charts.
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

// ─────────────────────────────────────────────────────────────────────────────
// New hooks — event-level policy rates + monthly forex
// ─────────────────────────────────────────────────────────────────────────────

/** Event-level policy rate decisions (step chart data) */
export function useRBIPolicyRates() {
  return useQuery<RBIPolicyRatesData>({
    queryKey: ["rbi", "policy-rates"],
    queryFn: async () => {
      const res = await fetch(`${BASE_PATH}/data/rbi/policy-rates.json`);
      if (!res.ok) throw new Error(`Failed to fetch RBI policy rates: ${res.status}`);
      return res.json();
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });
}

/** Monthly forex reserves (USD billion) */
export function useRBIForexReserves() {
  return useQuery<RBIForexData>({
    queryKey: ["rbi", "forex-reserves"],
    queryFn: async () => {
      const res = await fetch(`${BASE_PATH}/data/rbi/forex-reserves.json`);
      if (!res.ok) throw new Error(`Failed to fetch RBI forex reserves: ${res.status}`);
      return res.json();
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });
}

/**
 * Convert event-level policy rate data into DataSeries for step charts.
 * Each returned series contains only change-events (date + value).
 * Pair with LineChart's lineShape="hv" for correct step rendering.
 */
export function rbiPolicyRatesToSeries(data: RBIPolicyRatesData): DataSeries[] {
  const meta = {
    lastUpdated: data.lastUpdated,
    sourceUrl: RBI_URL,
    notes: data.notes,
  };

  const makePoints = (events: { date: string; value: number }[]) =>
    events.map((e) => ({ date: e.date, value: e.value }));

  return [
    {
      source: "rbi" as const,
      indicator: "Repo Rate",
      indicatorId: "RBI_REPO",
      unit: "%",
      frequency: "daily" as const,   // event-level, best mapped to "daily"
      data: makePoints(data.repoRate),
      metadata: meta,
    },
    {
      source: "rbi" as const,
      indicator: "Reverse Repo / SDF",
      indicatorId: "RBI_SDF",
      unit: "%",
      frequency: "daily" as const,
      data: makePoints(data.reverseRepoSDF),
      metadata: meta,
    },
    {
      source: "rbi" as const,
      indicator: "CRR",
      indicatorId: "RBI_CRR",
      unit: "%",
      frequency: "daily" as const,
      data: makePoints(data.crr),
      metadata: meta,
    },
    {
      source: "rbi" as const,
      indicator: "SLR",
      indicatorId: "RBI_SLR",
      unit: "%",
      frequency: "daily" as const,
      data: makePoints(data.slr),
      metadata: meta,
    },
  ];
}

/**
 * Convert monthly forex data into a DataSeries.
 */
export function rbiForexToSeries(data: RBIForexData): DataSeries {
  return {
    source: "rbi" as const,
    indicator: "Forex Reserves",
    indicatorId: "RBI_FOREX",
    unit: "USD bn",
    frequency: "monthly" as const,
    data: data.monthly.map((d) => ({ date: d.date, value: d.value })),
    metadata: {
      lastUpdated: data.lastUpdated,
      sourceUrl: RBI_URL,
      notes: data.notes,
    },
  };
}
