import { useQuery } from "@tanstack/react-query";
import type { CPIMonthlyData, CPIMonthDataPoint, DataSeries } from "@/lib/api/types";

const BASE_PATH = "/india-data-dashboard";

/**
 * Hook to load pre-fetched MoSPI CPI (Consumer Price Index) monthly data.
 *
 * All data is pre-generated as a static JSON file under public/data/mospi/,
 * avoiding CORS issues with the MoSPI API (which blocks browser requests).
 *
 * Source: MoSPI CPI API, All India Combined, base year 2012=100
 * Coverage: February 2014 – December 2025 (YoY % change)
 */
export function useCPIMonthlyData() {
  return useQuery<CPIMonthlyData>({
    queryKey: ["mospi", "cpi", "monthly"],
    queryFn: async () => {
      const url = `${BASE_PATH}/data/mospi/cpi-monthly.json`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("CPI data not available");
      }

      const text = await response.text();
      try {
        return JSON.parse(text) as CPIMonthlyData;
      } catch {
        throw new Error("CPI data returned invalid format");
      }
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });
}

type CPIField = keyof Omit<CPIMonthDataPoint, "year" | "month" | "label">;

export const CPI_FIELD_LABELS: Record<CPIField, string> = {
  general: "Headline CPI",
  foodBeverages: "Food & Beverages",
  fuelLight: "Fuel & Light",
  housing: "Housing",
  clothingFootwear: "Clothing & Footwear",
  miscellaneous: "Miscellaneous",
  cereals: "Cereals & Products",
  pulses: "Pulses & Products",
  oilsFats: "Oils & Fats",
  milkProducts: "Milk & Products",
  meatFish: "Meat & Fish",
  vegetables: "Vegetables",
  fruits: "Fruits",
  spices: "Spices",
};

/**
 * Convert CPI monthly data into DataSeries[] for use with chart components.
 *
 * @param data       The full CPI monthly dataset
 * @param fields     Which component series to include
 * @param sliceFrom  Optional: only include months from this year onward (e.g. 2016)
 */
export function cpiToSeries(
  data: CPIMonthlyData,
  fields: CPIField[],
  sliceFrom?: number
): DataSeries[] {
  const months = sliceFrom
    ? data.months.filter((m) => m.year >= sliceFrom)
    : data.months;

  return fields.map((field) => ({
    source: "mospi" as const,
    indicator: CPI_FIELD_LABELS[field],
    indicatorId: `CPI_${field.toUpperCase()}`,
    unit: "%",
    frequency: "monthly" as const,
    data: months
      .filter((m) => m[field] !== null)
      .map((m) => ({
        date: m.label,
        value: m[field] as number | null,
      })),
    metadata: {
      lastUpdated: data.lastUpdated,
      sourceUrl: data.sourceUrl,
      notes: data.notes,
    },
  }));
}
