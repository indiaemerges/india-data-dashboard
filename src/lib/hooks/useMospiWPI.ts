import { useQuery } from "@tanstack/react-query";
import type { WPIMonthlyData, WPIMonthDataPoint, DataSeries } from "@/lib/api/types";

const BASE_PATH = "/india-data-dashboard";

/**
 * Hook to load pre-fetched MoSPI WPI (Wholesale Price Index) monthly data.
 *
 * All data is pre-generated as a static JSON file under public/data/mospi/,
 * avoiding CORS issues with the MoSPI API (which blocks browser requests).
 *
 * Source: MoSPI WPI API, base year 2011-12=100
 * Coverage: April 2013 – January 2026 (YoY % change)
 */
export function useWPIMonthlyData() {
  return useQuery<WPIMonthlyData>({
    queryKey: ["mospi", "wpi", "monthly"],
    queryFn: async () => {
      const url = `${BASE_PATH}/data/mospi/wpi-monthly.json`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("WPI data not available");
      }

      const text = await response.text();
      try {
        return JSON.parse(text) as WPIMonthlyData;
      } catch {
        throw new Error("WPI data returned invalid format");
      }
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });
}

type WPIField = keyof Omit<WPIMonthDataPoint, "year" | "month" | "label">;

const WPI_FIELD_LABELS: Record<WPIField, string> = {
  headline: "Headline WPI",
  primaryArticles: "Primary Articles",
  fuelPower: "Fuel & Power",
  manufactured: "Manufactured Products",
  foodIndex: "WPI Food Index",
};

/**
 * Convert WPI monthly data into DataSeries[] for use with chart components.
 *
 * @param data    The full WPI monthly dataset
 * @param fields  Which component series to include
 * @param sliceFrom  Optional: only include months from this year onward (e.g. 2016)
 */
export function wpiToSeries(
  data: WPIMonthlyData,
  fields: WPIField[],
  sliceFrom?: number
): DataSeries[] {
  const months = sliceFrom
    ? data.monthly.filter((m) => m.year >= sliceFrom)
    : data.monthly;

  return fields.map((field) => ({
    source: "mospi" as const,
    indicator: WPI_FIELD_LABELS[field],
    indicatorId: `WPI_${field.toUpperCase()}`,
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
      notes: `${data.notes} Base year: ${data.baseYear}.`,
    },
  }));
}
