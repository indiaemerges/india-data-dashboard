import { useQuery } from "@tanstack/react-query";
import type { PLFSStateData, CPIStateData } from "@/lib/api/types";

const BASE_PATH = "/india-data-dashboard";

// ── Loaders ────────────────────────────────────────────────────────────────────

export function usePLFSStateData() {
  return useQuery<PLFSStateData>({
    queryKey: ["mospi", "plfs", "state"],
    queryFn: async () => {
      const res = await fetch(`${BASE_PATH}/data/mospi/plfs-state.json`);
      if (!res.ok) throw new Error("PLFS state data not available");
      return res.json() as Promise<PLFSStateData>;
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });
}

export function useCPIStateData() {
  return useQuery<CPIStateData>({
    queryKey: ["mospi", "cpi", "state"],
    queryFn: async () => {
      const res = await fetch(`${BASE_PATH}/data/mospi/cpi-state.json`);
      if (!res.ok) throw new Error("CPI state data not available");
      return res.json() as Promise<CPIStateData>;
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });
}

export function useIndiaGeoJSON() {
  return useQuery<object>({
    queryKey: ["geo", "india-states"],
    queryFn: async () => {
      const res = await fetch(`${BASE_PATH}/data/geo/india-states.geojson`);
      if (!res.ok) throw new Error("India states GeoJSON not available");
      return res.json() as Promise<object>;
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });
}

// ── Helper: extract parallel [geoName, value] arrays for a PLFS year index ──

export function plfsStateSlice(
  data: PLFSStateData,
  yearIndex: number,
  indicator: "ur_person" | "lfpr_female"
): { names: string[]; values: (number | null)[] } {
  const names: string[] = [];
  const values: (number | null)[] = [];
  for (const s of data.states) {
    names.push(s.geoName);
    values.push(s[indicator][yearIndex] ?? null);
  }
  return { names, values };
}

// ── Helper: extract latest-month CPI values across states ──────────────────

export function cpiStateLatest(data: CPIStateData): {
  names: string[];
  values: (number | null)[];
  monthLabel: string;
} {
  const lastIdx = data.months.length - 1;
  const monthLabel = data.months[lastIdx] ?? "";
  const names: string[] = [];
  const values: (number | null)[] = [];
  for (const s of data.states) {
    names.push(s.geoName);
    values.push(s.inflation[lastIdx] ?? null);
  }
  return { names, values, monthLabel };
}
