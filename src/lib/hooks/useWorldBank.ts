import { useQuery } from "@tanstack/react-query";
import {
  fetchWorldBankIndicator,
  fetchWorldBankIndicators,
} from "@/lib/api/worldbank";

/**
 * Hook to fetch a single World Bank indicator for India.
 * Uses TanStack Query for caching, deduplication, and retry.
 */
export function useWorldBankIndicator(
  indicatorId: string,
  options?: { years?: number; enabled?: boolean }
) {
  return useQuery({
    queryKey: ["worldbank", "IND", indicatorId],
    queryFn: () =>
      fetchWorldBankIndicator(indicatorId, options?.years ?? 30),
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 2,
    enabled: options?.enabled !== false,
  });
}

/**
 * Hook to fetch multiple World Bank indicators in parallel.
 */
export function useWorldBankIndicators(
  indicatorIds: string[],
  options?: { years?: number; enabled?: boolean }
) {
  return useQuery({
    queryKey: ["worldbank", "IND", "multi", ...indicatorIds],
    queryFn: () =>
      fetchWorldBankIndicators(indicatorIds, options?.years ?? 30),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 2,
    enabled: options?.enabled !== false,
  });
}
