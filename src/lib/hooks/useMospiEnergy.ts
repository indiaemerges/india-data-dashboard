import { useQuery } from "@tanstack/react-query";
import { fetchEnergyBalance } from "@/lib/api/mospi-energy";
import { transformEnergyBalance } from "@/lib/utils/energy-transform";
import type { SankeyData, EnergyUnit } from "@/lib/api/types";

const BASE_PATH = "/india-data-dashboard";

/**
 * Hook to fetch MoSPI Energy Balance data and transform it into
 * Sankey diagram format.
 *
 * Tries the live API first, then falls back to pre-built static JSON
 * for the 2023-24 KToE combination (the default view).
 */
export function useSankeyData(year: string, unit: EnergyUnit) {
  return useQuery<SankeyData>({
    queryKey: ["mospi", "energy", "sankey", year, unit],
    queryFn: async () => {
      try {
        // Try live API first
        const { supply, consumption } = await fetchEnergyBalance(year, unit);
        return transformEnergyBalance(supply, consumption, unit, year);
      } catch (error) {
        // For 2023-24 KToE, fall back to static JSON
        if (year === "2023-24" && unit === "KToE") {
          const response = await fetch(
            `${BASE_PATH}/data/mospi/energy-sankey-2023-24.json`
          );
          if (!response.ok) {
            throw new Error("Failed to load fallback energy data");
          }
          return response.json() as Promise<SankeyData>;
        }
        throw error;
      }
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 1, // Only 1 retry since we have a fallback
  });
}
