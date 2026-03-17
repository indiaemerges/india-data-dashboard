import { useQuery } from "@tanstack/react-query";
import type { AgricultureData, DataSeries } from "@/lib/api/types";

const BASE_PATH = "/india-data-dashboard";
const SOURCE_URL = "https://agricoop.nic.in/";

export function useAgricultureData() {
  return useQuery<AgricultureData>({
    queryKey: ["agriculture"],
    queryFn: async () => {
      const res = await fetch(`${BASE_PATH}/data/agriculture/agriculture.json`);
      if (!res.ok) throw new Error(`Failed to fetch agriculture data: ${res.status}`);
      return res.json();
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });
}

function meta(data: AgricultureData) {
  return { lastUpdated: data.lastUpdated, sourceUrl: SOURCE_URL, notes: data.notes };
}

/** Total foodgrain production (Mt) */
export function agricultureTotalFoodgrainSeries(data: AgricultureData): DataSeries {
  return {
    source: "moafw",
    indicator: "Total Foodgrain Production",
    indicatorId: "AGRI_FOODGRAIN_TOTAL",
    unit: "Mt",
    frequency: "annual",
    color: "#f97316",
    data: data.years.map((y, i) => ({ date: y, value: data.foodgrain.total[i] })),
    metadata: meta(data),
  };
}

/** Kharif and Rabi production (Mt) — for stacked bar */
export function agricultureKharifRabiSeries(data: AgricultureData): DataSeries[] {
  const m = meta(data);
  return [
    {
      source: "moafw",
      indicator: "Kharif",
      indicatorId: "AGRI_KHARIF",
      unit: "Mt",
      frequency: "annual",
      color: "#22c55e",
      data: data.years.map((y, i) => ({ date: y, value: data.foodgrain.kharif[i] })),
      metadata: m,
    },
    {
      source: "moafw",
      indicator: "Rabi",
      indicatorId: "AGRI_RABI",
      unit: "Mt",
      frequency: "annual",
      color: "#f59e0b",
      data: data.years.map((y, i) => ({ date: y, value: data.foodgrain.rabi[i] })),
      metadata: m,
    },
  ];
}

/** Major crop production series (Mt) */
export function agricultureCropsSeries(data: AgricultureData): DataSeries[] {
  const m = meta(data);
  const make = (
    indicator: string,
    id: string,
    values: number[],
    color: string
  ): DataSeries => ({
    source: "moafw",
    indicator,
    indicatorId: id,
    unit: "Mt",
    frequency: "annual",
    color,
    data: data.years.map((y, i) => ({ date: y, value: values[i] })),
    metadata: m,
  });
  return [
    make("Rice",           "AGRI_RICE",    data.crops.rice,          "#3b82f6"),
    make("Wheat",          "AGRI_WHEAT",   data.crops.wheat,         "#f59e0b"),
    make("Coarse Cereals", "AGRI_COARSE",  data.crops.coarseCereals, "#8b5cf6"),
    make("Pulses",         "AGRI_PULSES",  data.crops.pulses,        "#22c55e"),
  ];
}

/** MSP for rice and wheat (₹ per quintal) */
export function agricultureMSPSeries(data: AgricultureData): DataSeries[] {
  const m = meta(data);
  return [
    {
      source: "moafw",
      indicator: "Rice MSP",
      indicatorId: "AGRI_MSP_RICE",
      unit: "₹/quintal",
      frequency: "annual",
      color: "#3b82f6",
      data: data.years.map((y, i) => ({ date: y, value: data.msp.rice[i] })),
      metadata: m,
    },
    {
      source: "moafw",
      indicator: "Wheat MSP",
      indicatorId: "AGRI_MSP_WHEAT",
      unit: "₹/quintal",
      frequency: "annual",
      color: "#f59e0b",
      data: data.years.map((y, i) => ({ date: y, value: data.msp.wheat[i] })),
      metadata: m,
    },
  ];
}

/** FCI central pool stocks — rice, wheat, and mandatory buffer norm reference line */
export function agricultureFCIStocksSeries(data: AgricultureData): DataSeries[] {
  const m = meta(data);
  const norm = data.fciStocks.bufferNorm;
  return [
    {
      source: "fci",
      indicator: "Rice Stocks",
      indicatorId: "AGRI_FCI_RICE",
      unit: "Mt",
      frequency: "annual",
      color: "#3b82f6",
      data: data.years.map((y, i) => ({ date: y, value: data.fciStocks.rice[i] })),
      metadata: m,
    },
    {
      source: "fci",
      indicator: "Wheat Stocks",
      indicatorId: "AGRI_FCI_WHEAT",
      unit: "Mt",
      frequency: "annual",
      color: "#f59e0b",
      data: data.years.map((y, i) => ({ date: y, value: data.fciStocks.wheat[i] })),
      metadata: m,
    },
    {
      source: "fci",
      indicator: "Mandatory Buffer Norm",
      indicatorId: "AGRI_FCI_NORM",
      unit: "Mt",
      frequency: "annual",
      color: "#6b7280",
      data: data.years.map((y) => ({ date: y, value: norm })),
      metadata: m,
    },
  ];
}

/** Southwest monsoon rainfall % departure from LPA */
export function agricultureMonsoonSeries(data: AgricultureData): DataSeries {
  return {
    source: "imd",
    indicator: "Monsoon Departure from LPA",
    indicatorId: "AGRI_MONSOON",
    unit: "%",
    frequency: "annual",
    color: "#06b6d4",
    data: data.years.map((y, i) => ({ date: y, value: data.monsoon.departure[i] })),
    metadata: meta(data),
  };
}
