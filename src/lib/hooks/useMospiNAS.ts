import { useQuery } from "@tanstack/react-query";
import type { NASQuarterlyData, NASQuarterDataPoint, DataSeries } from "@/lib/api/types";

const BASE_PATH = "/india-data-dashboard";

/**
 * Hook to load pre-fetched MoSPI NAS quarterly GDP data.
 *
 * All data is pre-generated as a static JSON file under public/data/mospi/,
 * avoiding CORS issues with the MoSPI API (which blocks browser requests).
 *
 * Source: MoSPI National Accounts Statistics (NAS)
 *   - Indicator 22: GDP Growth Rate (%, constant prices = real YoY growth)
 *   - Indicator  5: Gross Domestic Product (₹ Crore, current & constant prices)
 * Base year: 2011-12 | Series: Current | Frequency: Quarterly
 */
export function useNASQuarterlyData() {
  return useQuery<NASQuarterlyData>({
    queryKey: ["mospi", "nas", "quarterly"],
    queryFn: async () => {
      const url = `${BASE_PATH}/data/mospi/nas-quarterly.json`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("NAS quarterly data not available");
      }

      const text = await response.text();
      try {
        return JSON.parse(text) as NASQuarterlyData;
      } catch {
        throw new Error("NAS quarterly data returned invalid format");
      }
    },
    staleTime: Infinity, // Static data never goes stale within a deployment
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
    retry: 1,
  });
}

/**
 * Convert NAS quarterly data to a DataSeries[] for use with chart components.
 *
 * @param data    The full NAS quarterly dataset
 * @param metric  Which metric to convert to a series
 *   - "realGrowth"    → Real GDP growth rate (%, YoY)
 *   - "nominalGrowth" → Nominal GDP growth rate (%, YoY)
 *   - "realGDP"       → Real GDP level (₹ Crore, constant 2011-12)
 *   - "nominalGDP"    → Nominal GDP level (₹ Crore, current prices)
 */
export function nasQuarterlyToSeries(
  data: NASQuarterlyData,
  metric: "realGrowth" | "nominalGrowth" | "realGDP" | "nominalGDP"
): DataSeries {
  const metaMap: Record<
    typeof metric,
    { indicator: string; unit: string; id: string }
  > = {
    realGrowth: {
      indicator: "Real GDP Growth Rate",
      unit: "%",
      id: "NAS_QUARTERLY_REAL_GROWTH",
    },
    nominalGrowth: {
      indicator: "Nominal GDP Growth Rate",
      unit: "%",
      id: "NAS_QUARTERLY_NOMINAL_GROWTH",
    },
    realGDP: {
      indicator: "Real GDP (Constant 2011-12 Prices)",
      unit: "₹ Crore",
      id: "NAS_QUARTERLY_REAL_GDP",
    },
    nominalGDP: {
      indicator: "Nominal GDP (Current Prices)",
      unit: "₹ Crore",
      id: "NAS_QUARTERLY_NOMINAL_GDP",
    },
  };

  const meta = metaMap[metric];

  return {
    source: "mospi",
    indicator: meta.indicator,
    indicatorId: meta.id,
    unit: meta.unit,
    frequency: "quarterly",
    data: data.quarters
      .filter((q: NASQuarterDataPoint) => q[metric] !== null)
      .map((q: NASQuarterDataPoint) => ({
        date: q.label,
        value: q[metric] as number | null,
      })),
    metadata: {
      lastUpdated: data.lastUpdated,
      sourceUrl: data.sourceUrl,
      notes: data.notes,
    },
  };
}
