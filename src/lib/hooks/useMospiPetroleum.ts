import { useQuery } from "@tanstack/react-query";
import type { PetroleumData, DataSeries } from "@/lib/api/types";

const BASE_PATH = "/india-data-dashboard";
const SOURCE_URL = "https://mospi.gov.in/";

/**
 * Hook to load pre-fetched MoSPI ENERGY petroleum data.
 *
 * Data covers crude oil production, imports, refinery throughput,
 * oil product trade, and final consumption by product type.
 * All values are in KToE (Thousand Tonnes of Oil Equivalent).
 * Years: 2012-13 to 2023-24.
 */
export function usePetroleumData() {
  return useQuery<PetroleumData>({
    queryKey: ["mospi", "petroleum"],
    queryFn: async () => {
      const url = `${BASE_PATH}/data/mospi/petroleum.json`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Petroleum data not available");
      }
      const text = await response.text();
      try {
        return JSON.parse(text) as PetroleumData;
      } catch {
        throw new Error("Petroleum data returned invalid format");
      }
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });
}

/** Convert crude oil supply data into DataSeries[] */
export function petroleumSupplySeries(data: PetroleumData): DataSeries[] {
  const makePoints = (values: number[]) =>
    data.years.map((y, i) => ({ date: y, value: values[i] ?? null }));

  const meta = {
    lastUpdated: data.lastUpdated,
    sourceUrl: SOURCE_URL,
    notes: data.notes,
  };

  return [
    {
      source: "mospi" as const,
      indicator: "Crude Oil Production",
      indicatorId: "PETRO_CRUDE_PROD",
      unit: "KToE",
      frequency: "annual" as const,
      data: makePoints(data.supply.crudeOilProduction),
      metadata: meta,
    },
    {
      source: "mospi" as const,
      indicator: "Crude Oil Imports",
      indicatorId: "PETRO_CRUDE_IMP",
      unit: "KToE",
      frequency: "annual" as const,
      data: makePoints(data.supply.crudeOilImports),
      metadata: meta,
    },
    {
      source: "mospi" as const,
      indicator: "Refinery Throughput",
      indicatorId: "PETRO_REFINERY",
      unit: "KToE",
      frequency: "annual" as const,
      data: makePoints(data.supply.refineryThroughput),
      metadata: meta,
    },
  ];
}

/** Convert oil product trade data into DataSeries[] */
export function petroleumTradeSeries(data: PetroleumData): DataSeries[] {
  const makePoints = (values: number[]) =>
    data.years.map((y, i) => ({ date: y, value: values[i] ?? null }));

  const meta = {
    lastUpdated: data.lastUpdated,
    sourceUrl: SOURCE_URL,
    notes: data.notes,
  };

  return [
    {
      source: "mospi" as const,
      indicator: "Oil Product Exports",
      indicatorId: "PETRO_PROD_EXP",
      unit: "KToE",
      frequency: "annual" as const,
      data: makePoints(data.supply.oilProductExports),
      metadata: meta,
    },
    {
      source: "mospi" as const,
      indicator: "Oil Product Imports",
      indicatorId: "PETRO_PROD_IMP",
      unit: "KToE",
      frequency: "annual" as const,
      data: makePoints(data.supply.oilProductImports),
      metadata: meta,
    },
  ];
}

/**
 * Convert petroleum product consumption into DataSeries[].
 * Returns key transport fuels and household fuels for chart display.
 */
export function petroleumConsumptionSeries(data: PetroleumData): DataSeries[] {
  const makePoints = (values: number[]) =>
    data.years.map((y, i) => ({ date: y, value: values[i] ?? null }));

  const meta = {
    lastUpdated: data.lastUpdated,
    sourceUrl: SOURCE_URL,
    notes: "Final consumption by product type. Source: MoSPI Energy Balance.",
  };

  return [
    {
      source: "mospi" as const,
      indicator: "Diesel (HSD+LDO)",
      indicatorId: "PETRO_CONS_DIESEL",
      unit: "KToE",
      frequency: "annual" as const,
      data: makePoints(data.consumption.diesel),
      metadata: meta,
    },
    {
      source: "mospi" as const,
      indicator: "Petrol",
      indicatorId: "PETRO_CONS_PETROL",
      unit: "KToE",
      frequency: "annual" as const,
      data: makePoints(data.consumption.petrol),
      metadata: meta,
    },
    {
      source: "mospi" as const,
      indicator: "LPG",
      indicatorId: "PETRO_CONS_LPG",
      unit: "KToE",
      frequency: "annual" as const,
      data: makePoints(data.consumption.lpg),
      metadata: meta,
    },
    {
      source: "mospi" as const,
      indicator: "Naphtha",
      indicatorId: "PETRO_CONS_NAPHTHA",
      unit: "KToE",
      frequency: "annual" as const,
      data: makePoints(data.consumption.naphtha),
      metadata: meta,
    },
    {
      source: "mospi" as const,
      indicator: "Petroleum Coke",
      indicatorId: "PETRO_CONS_PETCOKE",
      unit: "KToE",
      frequency: "annual" as const,
      data: makePoints(data.consumption.petCoke),
      metadata: meta,
    },
    {
      source: "mospi" as const,
      indicator: "ATF",
      indicatorId: "PETRO_CONS_ATF",
      unit: "KToE",
      frequency: "annual" as const,
      data: makePoints(data.consumption.atf),
      metadata: meta,
    },
    {
      source: "mospi" as const,
      indicator: "Fuel Oil",
      indicatorId: "PETRO_CONS_FUOIL",
      unit: "KToE",
      frequency: "annual" as const,
      data: makePoints(data.consumption.fuelOil),
      metadata: meta,
    },
    {
      source: "mospi" as const,
      indicator: "Kerosene",
      indicatorId: "PETRO_CONS_KERO",
      unit: "KToE",
      frequency: "annual" as const,
      data: makePoints(data.consumption.kerosene),
      metadata: meta,
    },
  ];
}
