import { useQuery } from "@tanstack/react-query";
import type { RBIBankingData, DataSeries } from "@/lib/api/types";

const BASE_PATH = "/india-data-dashboard";
const SOURCE_URL = "https://dbie.rbi.org.in/";

export function useRBIBankingData() {
  return useQuery<RBIBankingData>({
    queryKey: ["rbi", "banking"],
    queryFn: async () => {
      const res = await fetch(`${BASE_PATH}/data/rbi/banking.json`);
      if (!res.ok) throw new Error(`Failed to fetch banking data: ${res.status}`);
      return res.json();
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });
}

function meta(data: RBIBankingData) {
  return { lastUpdated: data.lastUpdated, sourceUrl: SOURCE_URL, notes: data.notes };
}

/** Bank Credit and Deposits (₹ lakh crore) */
export function bankingCreditDepositSeries(data: RBIBankingData): DataSeries[] {
  const m = meta(data);
  return [
    {
      source: "rbi",
      indicator: "Bank Credit",
      indicatorId: "RBI_BANK_CREDIT",
      unit: "₹ Lakh Cr",
      frequency: "annual",
      data: data.years.map((y, i) => ({ date: y, value: data.credit[i] })),
      metadata: m,
    },
    {
      source: "rbi",
      indicator: "Bank Deposits",
      indicatorId: "RBI_BANK_DEPOSITS",
      unit: "₹ Lakh Cr",
      frequency: "annual",
      data: data.years.map((y, i) => ({ date: y, value: data.deposits[i] })),
      metadata: m,
    },
  ];
}

/** YoY Credit and Deposit growth (%) */
export function bankingGrowthSeries(data: RBIBankingData): DataSeries[] {
  const m = meta(data);
  return [
    {
      source: "rbi",
      indicator: "Credit Growth",
      indicatorId: "RBI_CREDIT_GROWTH",
      unit: "%",
      frequency: "annual",
      data: data.years.map((y, i) => ({ date: y, value: data.creditGrowth[i] ?? null })),
      metadata: m,
    },
    {
      source: "rbi",
      indicator: "Deposit Growth",
      indicatorId: "RBI_DEPOSIT_GROWTH",
      unit: "%",
      frequency: "annual",
      data: data.years.map((y, i) => ({ date: y, value: data.depositGrowth[i] ?? null })),
      metadata: m,
    },
  ];
}

/** Credit-to-GDP ratio (%) */
export function bankingCreditToGDPSeries(data: RBIBankingData): DataSeries {
  return {
    source: "rbi",
    indicator: "Credit-to-GDP",
    indicatorId: "RBI_CREDIT_GDP",
    unit: "%",
    frequency: "annual",
    data: data.years.map((y, i) => ({ date: y, value: data.creditToGDP[i] })),
    metadata: meta(data),
  };
}

/** Credit-to-Deposit ratio (%) */
export function bankingCDRatioSeries(data: RBIBankingData): DataSeries {
  return {
    source: "rbi",
    indicator: "Credit-to-Deposit Ratio",
    indicatorId: "RBI_CD_RATIO",
    unit: "%",
    frequency: "annual",
    data: data.years.map((y, i) => ({ date: y, value: data.cdRatio[i] })),
    metadata: meta(data),
  };
}

/** GNPA ratio (%) — all SCBs (single series, used for summary card) */
export function bankingGNPASeries(data: RBIBankingData): DataSeries {
  const g = data.gnpa;
  return {
    source: "rbi",
    indicator: "All SCBs",
    indicatorId: "RBI_GNPA",
    unit: "%",
    frequency: "annual",
    data: g.years.map((y, i) => ({ date: y, value: g.ratio[i] })),
    metadata: meta(data),
  };
}

/** GNPA ratio split by bank type — PSB vs Private vs All SCBs */
export function bankingGNPABySectorSeries(data: RBIBankingData): DataSeries[] {
  const g = data.gnpa;
  const m = meta(data);
  const make = (indicator: string, id: string, values: number[], color: string): DataSeries => ({
    source: "rbi",
    indicator,
    indicatorId: id,
    unit: "%",
    frequency: "annual",
    color,
    data: g.years.map((y, i) => ({ date: y, value: values[i] })),
    metadata: m,
  });
  return [
    make("Public Sector Banks",  "RBI_GNPA_PSB",     g.psb,          "#ef4444"),
    make("All SCBs",             "RBI_GNPA_ALL",     g.ratio,        "#f97316"),
    make("Private Sector Banks", "RBI_GNPA_PRIVATE", g.privateBanks, "#22c55e"),
  ];
}

/** Capital Adequacy Ratio (CRAR, %) — all SCBs, PSBs, and Private banks */
export function bankingCRARSeries(data: RBIBankingData): DataSeries[] {
  const c = data.crar;
  const m = meta(data);
  const make = (indicator: string, id: string, values: number[], color: string): DataSeries => ({
    source: "rbi",
    indicator,
    indicatorId: id,
    unit: "%",
    frequency: "annual",
    color,
    data: c.years.map((y, i) => ({ date: y, value: values[i] })),
    metadata: m,
  });
  return [
    make("Private Sector Banks", "RBI_CRAR_PRIVATE", c.privateBanks, "#22c55e"),
    make("All SCBs",             "RBI_CRAR_ALL",     c.allBanks,     "#f97316"),
    make("Public Sector Banks",  "RBI_CRAR_PSB",     c.psb,          "#ef4444"),
  ];
}

/** YoY credit growth (%) by bank type — PSB vs Private. Derived from credit levels. */
export function bankingCreditGrowthByTypeSeries(data: RBIBankingData): DataSeries[] {
  const c = data.creditByBankType;
  const m = meta(data);
  const growth = (arr: number[]) =>
    arr.map((v, i) => (i === 0 ? null : Math.round(((v - arr[i - 1]) / arr[i - 1]) * 1000) / 10));

  const make = (
    indicator: string,
    id: string,
    values: (number | null)[],
    color: string
  ): DataSeries => ({
    source: "rbi",
    indicator,
    indicatorId: id,
    unit: "%",
    frequency: "annual",
    color,
    data: c.years.map((y, i) => ({ date: y, value: values[i] })),
    metadata: m,
  });

  return [
    make("Private Sector Banks", "RBI_CREDIT_GROWTH_PVT", growth(c.privateBanks), "#22c55e"),
    make("Public Sector Banks",  "RBI_CREDIT_GROWTH_PSB", growth(c.psb),          "#ef4444"),
  ];
}

/** PSB and Private bank shares of total SCB credit (%) */
export function bankingMarketShareSeries(data: RBIBankingData): DataSeries[] {
  const c = data.creditByBankType;
  const total = data.credit;          // all-SCB non-food credit (same years array)
  const m = meta(data);

  const make = (
    indicator: string,
    id: string,
    credits: number[],
    color: string
  ): DataSeries => ({
    source: "rbi",
    indicator,
    indicatorId: id,
    unit: "%",
    frequency: "annual",
    color,
    data: c.years.map((y, i) => ({
      date: y,
      value: Math.round((credits[i] / total[i]) * 1000) / 10,
    })),
    metadata: m,
  });

  return [
    make("Public Sector Banks",  "RBI_SHARE_PSB",     c.psb,          "#ef4444"),
    make("Private Sector Banks", "RBI_SHARE_PRIVATE", c.privateBanks, "#22c55e"),
  ];
}

/** Sectoral credit shares (%) as individual series */
export function bankingSectoralSeries(data: RBIBankingData): DataSeries[] {
  const s = data.sectoralCredit;
  const m = meta(data);
  const make = (
    indicator: string,
    id: string,
    values: number[],
    color: string
  ): DataSeries => ({
    source: "rbi",
    indicator,
    indicatorId: id,
    unit: "% of credit",
    frequency: "annual",
    color,
    data: s.years.map((y, i) => ({ date: y, value: values[i] })),
    metadata: m,
  });

  return [
    make("Personal Loans",   "RBI_CREDIT_PERSONAL",  s.personalLoans, "#f97316"),
    make("Services",         "RBI_CREDIT_SERVICES",  s.services,      "#3b82f6"),
    make("Industry",         "RBI_CREDIT_INDUSTRY",  s.industry,      "#6366f1"),
    make("Agriculture",      "RBI_CREDIT_AGRI",      s.agriculture,   "#22c55e"),
  ];
}
