import { useQuery } from "@tanstack/react-query";
import type { ASIAnnualData, DataSeries } from "@/lib/api/types";

const BASE_PATH = "/india-data-dashboard";

// ─── Scaling constants ────────────────────────────────────────────────────────
/**
 * Convert ₹ lakhs → ₹ Lakh Crore.
 *
 * Derivation:
 *   1 lakh crore  = 1,00,000 crore  (Indian numbering)
 *                 = 1,00,000 × 1,00,00,000 rupees
 *                 = 10^12 rupees
 *   1 lakh        = 10^5  rupees
 *   ∴ 1 lakh crore = 10^12 / 10^5 = 10^7 lakhs
 *
 * So: value_in_lakh_crore = value_in_lakhs / 10_000_000
 */
const TO_LAKH_CR = 1_00_00_000; // = 10_000_000

// ─── Data fetching hook ───────────────────────────────────────────────────────

/**
 * Hook to load pre-fetched MoSPI ASI (Annual Survey of Industries) data.
 * Static JSON covers 2008-09 to 2023-24, NIC 2008 classification.
 */
export function useASIAnnualData() {
  return useQuery<ASIAnnualData>({
    queryKey: ["mospi", "asi", "annual"],
    queryFn: async () => {
      const url = `${BASE_PATH}/data/mospi/asi-annual.json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("ASI data not available");
      const text = await res.text();
      try {
        return JSON.parse(text) as ASIAnnualData;
      } catch {
        throw new Error("ASI data returned invalid format");
      }
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function meta(data: ASIAnnualData) {
  return {
    lastUpdated: data.lastUpdated,
    sourceUrl: data.sourceUrl,
    notes: data.notes,
  };
}

// ─── Trend series (financial in ₹ Lakh Cr, counts in millions) ───────────────

/** GVA and Total Output trend (₹ Lakh Crore) */
export function asiOutputSeries(data: ASIAnnualData): DataSeries[] {
  const pairs: [keyof ASIAnnualData["totals"], string][] = [
    ["gva", "Gross Value Added"],
    ["output", "Total Output"],
  ];
  return pairs.map(([key, label]) => ({
    source: "mospi" as const,
    indicator: label,
    unit: "₹ Lakh Cr",
    frequency: "annual" as const,
    data: data.years.map((year, i) => ({
      date: year,
      value: +((data.totals[key][i] as number) / TO_LAKH_CR).toFixed(2),
    })),
    metadata: meta(data),
  }));
}

/** Fixed Capital trend (₹ Lakh Crore) */
export function asiCapitalSeries(data: ASIAnnualData): DataSeries {
  return {
    source: "mospi" as const,
    indicator: "Fixed Capital",
    unit: "₹ Lakh Cr",
    frequency: "annual" as const,
    data: data.years.map((year, i) => ({
      date: year,
      value: +(data.totals.fixedCapital[i] / TO_LAKH_CR).toFixed(2),
    })),
    metadata: meta(data),
  };
}

/** Wages trend (₹ Lakh Crore) */
export function asiWagesSeries(data: ASIAnnualData): DataSeries {
  return {
    source: "mospi" as const,
    indicator: "Total Wages & Salaries",
    unit: "₹ Lakh Cr",
    frequency: "annual" as const,
    data: data.years.map((year, i) => ({
      date: year,
      value: +(data.totals.wages[i] / TO_LAKH_CR).toFixed(2),
    })),
    metadata: meta(data),
  };
}

/** Workers & Persons Engaged trend (millions) */
export function asiWorkersSeries(data: ASIAnnualData): DataSeries[] {
  return [
    {
      source: "mospi" as const,
      indicator: "Total Workers",
      unit: "Million",
      frequency: "annual" as const,
      data: data.years.map((year, i) => ({
        date: year,
        value: +(data.totals.workers[i] / 1_000_000).toFixed(2),
      })),
      metadata: meta(data),
    },
    {
      source: "mospi" as const,
      indicator: "Persons Engaged",
      unit: "Million",
      frequency: "annual" as const,
      data: data.years.map((year, i) => ({
        date: year,
        value: +(data.totals.personsEngaged[i] / 1_000_000).toFixed(2),
      })),
      metadata: meta(data),
    },
  ];
}

/** Directly employed male and female workers trend (millions) */
export function asiGenderWorkersSeries(data: ASIAnnualData): DataSeries[] {
  return [
    {
      source: "mospi" as const,
      indicator: "Male Workers",
      unit: "Million",
      frequency: "annual" as const,
      data: data.years.map((year, i) => ({
        date: year,
        value: +(data.totals.maleWorkers[i] / 1_000_000).toFixed(2),
      })),
      metadata: meta(data),
    },
    {
      source: "mospi" as const,
      indicator: "Female Workers",
      unit: "Million",
      frequency: "annual" as const,
      data: data.years.map((year, i) => ({
        date: year,
        value: +(data.totals.femaleWorkers[i] / 1_000_000).toFixed(2),
      })),
      metadata: meta(data),
    },
  ];
}

// ─── Derived metric series ────────────────────────────────────────────────────

/** Labour productivity: GVA per worker (₹ Lakhs/worker) */
export function asiProductivitySeries(data: ASIAnnualData): DataSeries {
  return {
    source: "mospi" as const,
    indicator: "GVA per Worker",
    unit: "₹ Lakh",
    frequency: "annual" as const,
    data: data.years.map((year, i) => {
      const gva = data.totals.gva[i];
      const w = data.totals.workers[i];
      return {
        date: year,
        value: gva != null && w > 0 ? +(gva / w).toFixed(2) : null,
      };
    }),
    metadata: meta(data),
  };
}

/** Wage per worker (₹ Lakhs/worker/year) */
export function asiWagePerWorkerSeries(data: ASIAnnualData): DataSeries {
  return {
    source: "mospi" as const,
    indicator: "Wages per Worker",
    unit: "₹ Lakh",
    frequency: "annual" as const,
    data: data.years.map((year, i) => {
      const wages = data.totals.wages[i];
      const w = data.totals.workers[i];
      return {
        date: year,
        value: wages != null && w > 0 ? +(wages / w).toFixed(2) : null,
      };
    }),
    metadata: meta(data),
  };
}

/** Female worker share (% of directly employed male+female) */
export function asiFemaleShareSeries(data: ASIAnnualData): DataSeries {
  return {
    source: "mospi" as const,
    indicator: "Female Worker Share",
    unit: "%",
    frequency: "annual" as const,
    data: data.years.map((year, i) => {
      const f = data.totals.femaleWorkers[i];
      const m = data.totals.maleWorkers[i];
      const total = m + f;
      return {
        date: year,
        value: total > 0 ? +((f / total) * 100).toFixed(1) : null,
      };
    }),
    metadata: meta(data),
  };
}

// ─── Sector breakdown ─────────────────────────────────────────────────────────

type ASINICIndicator = "gva" | "workers" | "fixedCapital" | "wages";

const NIC_INDICATOR_LABELS: Record<ASINICIndicator, string> = {
  gva: "GVA",
  workers: "Workers",
  fixedCapital: "Fixed Capital",
  wages: "Total Wages",
};

const NIC_UNITS: Record<ASINICIndicator, string> = {
  gva: "₹ Lakh Cr",
  fixedCapital: "₹ Lakh Cr",
  wages: "₹ Lakh Cr",
  workers: "Count",
};

const FINANCIAL_INDICATORS = new Set<ASINICIndicator>(["gva", "fixedCapital", "wages"]);

/**
 * Returns a single DataSeries suitable for a horizontal bar chart,
 * with each data point being one manufacturing NIC sector.
 *
 * Sectors are filtered to NIC 10–33 (manufacturing only) and sorted
 * descending by value; at most `topN` sectors returned.
 */
export function asiNICSeries(
  data: ASIAnnualData,
  yearIndex: number,
  indicator: ASINICIndicator,
  topN = 14
): DataSeries {
  const isFinancial = FINANCIAL_INDICATORS.has(indicator);

  const mfgSectors = data.byNIC.filter((s) => {
    const code = parseInt(s.nicCode, 10);
    return code >= 10 && code <= 33;
  });

  const sorted = mfgSectors
    .map((s) => {
      const raw = s[indicator][yearIndex] ?? 0;
      return {
        label: s.nicNameShort,
        value: isFinancial ? +(raw / TO_LAKH_CR).toFixed(2) : raw,
      };
    })
    .sort((a, b) => a.value - b.value) // ascending so top sector is at top in horizontal bar
    .slice(-topN);

  return {
    source: "mospi" as const,
    indicator: `${NIC_INDICATOR_LABELS[indicator]} by Sector (${data.years[yearIndex]})`,
    unit: NIC_UNITS[indicator],
    frequency: "annual" as const,
    data: sorted.map((d) => ({ date: d.label, value: d.value, label: d.label })),
    metadata: meta(data),
  };
}

/**
 * Helper: get the index of the latest year in the data.
 */
export function asiLatestYearIndex(data: ASIAnnualData): number {
  return data.years.length - 1;
}
