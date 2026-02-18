import { useQuery } from "@tanstack/react-query";
import type { IIPAnnualData, DataSeries } from "@/lib/api/types";

const BASE_PATH = "/india-data-dashboard";

/**
 * Hook to load pre-fetched MoSPI IIP (Index of Industrial Production) data.
 *
 * All data is pre-generated as a static JSON file under public/data/mospi/,
 * avoiding CORS issues with the MoSPI API (which blocks browser requests).
 */
export function useIIPAnnualData() {
  return useQuery<IIPAnnualData>({
    queryKey: ["mospi", "iip", "annual"],
    queryFn: async () => {
      const url = `${BASE_PATH}/data/mospi/iip-annual.json`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("IIP data not available");
      }

      // Guard against HTML error pages disguised as 200 OK
      const text = await response.text();
      try {
        return JSON.parse(text) as IIPAnnualData;
      } catch {
        throw new Error("IIP data returned invalid format");
      }
    },
    staleTime: Infinity, // Static data never goes stale within a deployment
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
    retry: 1,
  });
}

/**
 * Convert IIP data into DataSeries[] for use with chart components.
 *
 * @param data       The full IIP annual dataset
 * @param group      "sectoral" or "useBased"
 * @param categories Array of category names to include (e.g., ["General", "Mining"])
 * @param metric     "index" for IIP index values, "growth" for YoY growth rates
 */
export function iipToSeries(
  data: IIPAnnualData,
  group: "sectoral" | "useBased",
  categories: string[],
  metric: "index" | "growth"
): DataSeries[] {
  const source = group === "sectoral" ? data.sectoral : data.useBased;

  return categories
    .map((cat) => {
      const catData = source[cat];
      if (!catData) return null;

      const values = metric === "index" ? catData.index : catData.growth;

      return {
        source: "mospi" as const,
        indicator: cat,
        indicatorId: `IIP_${group}_${cat}_${metric}`,
        unit: metric === "index" ? "Index" : "%",
        frequency: "annual" as const,
        data: data.years.map((year, i) => ({
          date: year,
          value: values[i] ?? null,
        })),
        metadata: {
          lastUpdated: data.lastUpdated,
          sourceUrl: "https://www.mospi.gov.in/",
          notes: `Base year: ${data.baseYear}`,
        },
      };
    })
    .filter(Boolean) as DataSeries[];
}
