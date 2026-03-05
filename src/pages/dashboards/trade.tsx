import Head from "next/head";
import { useWorldBankIndicators } from "@/lib/hooks/useWorldBank";
import { WORLD_BANK_INDICATORS } from "@/lib/api/worldbank";
import LineChart from "@/components/charts/LineChart";
import SeriesFilterChart from "@/components/charts/SeriesFilterChart";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorDisplay from "@/components/ui/ErrorDisplay";
import type { DataSeries } from "@/lib/api/types";

// ── Helpers ────────────────────────────────────────────────────────────────

/** Scale a raw-USD DataSeries to USD Billions (1 decimal place) and relabel. */
function toUsdBn(s: DataSeries, name: string): DataSeries {
  return {
    ...s,
    indicator: name,
    unit: "USD Bn",
    data: s.data.map((d) => ({
      ...d,
      value: d.value != null ? Math.round(d.value / 1e8) / 10 : null,
    })),
  };
}

/**
 * Compute (rawExports − rawImports) joined by year and scaled to USD Bn.
 * Both input series must be raw USD (not already scaled).
 */
function computeBalanceRaw(
  rawExp: DataSeries,
  rawImp: DataSeries,
  name: string
): DataSeries {
  const impMap = new Map(rawImp.data.map((d) => [d.date, d.value]));
  return {
    ...rawExp,
    indicator: name,
    indicatorId: undefined,
    unit: "USD Bn",
    data: rawExp.data
      .map((d) => {
        const imp = impMap.get(d.date);
        if (d.value == null || imp == null) return null;
        return { date: d.date, value: Math.round((d.value - imp) / 1e8) / 10 };
      })
      .filter((d): d is { date: string; value: number } => d !== null),
  };
}

/** Return the last data point of a series (already-scaled). */
function latestPoint(s: DataSeries | null | undefined) {
  if (!s) return { value: null as number | null, year: "" };
  const last = s.data.at(-1);
  return { value: last?.value ?? null, year: last?.date ?? "" };
}

/** Format a USD Billion value with sign and 1 decimal. */
function fmtBn(v: number | null): string {
  if (v == null) return "—";
  const abs = Math.abs(v);
  return `${v < 0 ? "−" : ""}$${abs.toFixed(1)} Bn`;
}

// ── All indicator IDs to fetch ─────────────────────────────────────────────

const WB = WORLD_BANK_INDICATORS;

const FETCH_IDS = [
  WB.MERCH_EXPORTS_USD,
  WB.MERCH_IMPORTS_USD,
  WB.SERVICES_EXPORTS_USD,
  WB.SERVICES_IMPORTS_USD,
  WB.FDI_INFLOWS_USD,
  WB.CURRENT_ACCOUNT_USD,
  WB.HIGH_TECH_EXPORTS_PCT,
  WB.EXPORTS_GDP_PCT,
  WB.IMPORTS_GDP_PCT,
];

// ── Component ──────────────────────────────────────────────────────────────

export default function TradeDashboard() {
  const { data: series, isLoading, error, refetch } = useWorldBankIndicators(
    FETCH_IDS,
    { years: 40 }
  );

  if (isLoading) return <LoadingSpinner message="Fetching trade data..." />;
  if (error || !series?.length) {
    return (
      <ErrorDisplay
        message={error instanceof Error ? error.message : "Failed to fetch trade data"}
        onRetry={() => refetch()}
      />
    );
  }

  // ── Find raw series by indicator ID ───────────────────────────────────────
  const get = (id: string) => series.find((s) => s.indicatorId === id);

  const rawMerchExp = get(WB.MERCH_EXPORTS_USD);
  const rawMerchImp = get(WB.MERCH_IMPORTS_USD);
  const rawSvcExp   = get(WB.SERVICES_EXPORTS_USD);
  const rawSvcImp   = get(WB.SERVICES_IMPORTS_USD);
  const rawFdi      = get(WB.FDI_INFLOWS_USD);
  const rawCab      = get(WB.CURRENT_ACCOUNT_USD);
  const rawHiTech   = get(WB.HIGH_TECH_EXPORTS_PCT);

  // ── Scale volume series to USD Bn ─────────────────────────────────────────
  const merchExp = rawMerchExp ? toUsdBn(rawMerchExp, "Merchandise Exports") : null;
  const merchImp = rawMerchImp ? toUsdBn(rawMerchImp, "Merchandise Imports") : null;
  const svcExp   = rawSvcExp   ? toUsdBn(rawSvcExp,   "Services Exports")    : null;
  const svcImp   = rawSvcImp   ? toUsdBn(rawSvcImp,   "Services Imports")    : null;
  const fdi      = rawFdi      ? toUsdBn(rawFdi,      "FDI Net Inflows")     : null;
  const cab      = rawCab      ? toUsdBn(rawCab,      "Current Account Balance") : null;

  // ── Compute trade balance series (from raw, to avoid double-scaling) ──────
  const merchBalance   = rawMerchExp && rawMerchImp
    ? computeBalanceRaw(rawMerchExp, rawMerchImp, "Merchandise Balance") : null;
  const svcBalance     = rawSvcExp && rawSvcImp
    ? computeBalanceRaw(rawSvcExp, rawSvcImp, "Services Balance")        : null;

  // Overall = merchandise balance + services balance (both already in USD Bn)
  const overallBalance: DataSeries | null = (() => {
    if (!merchBalance || !svcBalance) return null;
    const svcMap = new Map(svcBalance.data.map((d) => [d.date, d.value]));
    return {
      ...merchBalance,
      indicator: "Overall Trade Balance",
      data: merchBalance.data
        .map((d) => {
          const sv = svcMap.get(d.date);
          return sv != null && d.value != null
            ? { ...d, value: Math.round((d.value + sv) * 10) / 10 }
            : null;
        })
        .filter((d): d is { date: string; value: number } => d !== null),
    };
  })();

  // ── Summary card values ───────────────────────────────────────────────────
  const lME  = latestPoint(merchExp);
  const lMI  = latestPoint(merchImp);
  const lSE  = latestPoint(svcExp);
  const lSI  = latestPoint(svcImp);

  const lTotalExp = lME.value != null && lSE.value != null
    ? { value: Math.round((lME.value + lSE.value) * 10) / 10, year: lME.year }
    : { value: null as number | null, year: "" };

  const lTotalImp = lMI.value != null && lSI.value != null
    ? { value: Math.round((lMI.value + lSI.value) * 10) / 10, year: lMI.year }
    : { value: null as number | null, year: "" };

  const lBalance = lTotalExp.value != null && lTotalImp.value != null
    ? { value: Math.round((lTotalExp.value - lTotalImp.value) * 10) / 10, year: lTotalExp.year }
    : { value: null as number | null, year: "" };

  const lSvcBal = lSE.value != null && lSI.value != null
    ? { value: Math.round((lSE.value - lSI.value) * 10) / 10, year: lSE.year }
    : { value: null as number | null, year: "" };

  // ── Chart series arrays ───────────────────────────────────────────────────
  const volumeSeries  = [merchExp, svcExp, merchImp, svcImp].filter(Boolean) as DataSeries[];
  const balanceSeries = [overallBalance, svcBalance, merchBalance].filter(Boolean) as DataSeries[];
  const fdiCabSeries  = [fdi, cab].filter(Boolean) as DataSeries[];
  const gdpPctSeries  = series.filter(
    (s) => s.indicatorId === WB.EXPORTS_GDP_PCT || s.indicatorId === WB.IMPORTS_GDP_PCT
  );
  const hiTechSeries  = rawHiTech
    ? [{ ...rawHiTech, indicator: "High-Technology Exports" }]
    : [];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>International Trade | India Data Dashboard</title>
      </Head>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          International Trade
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          India&apos;s merchandise and services trade flows, trade balance, FDI, and
          export composition. Source: World Bank Balance of Payments statistics.
        </p>

        {/* ── Summary cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total Exports{lTotalExp.year ? ` (${lTotalExp.year})` : ""}
            </p>
            <p className="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">
              {fmtBn(lTotalExp.value)}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Goods + Services combined
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total Imports{lTotalImp.year ? ` (${lTotalImp.year})` : ""}
            </p>
            <p className="text-2xl font-bold mt-1 text-red-500 dark:text-red-400">
              {fmtBn(lTotalImp.value)}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Goods + Services combined
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Trade Balance{lBalance.year ? ` (${lBalance.year})` : ""}
            </p>
            <p className={`text-2xl font-bold mt-1 ${
              lBalance.value != null && lBalance.value >= 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-500 dark:text-red-400"
            }`}>
              {fmtBn(lBalance.value)}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Overall goods &amp; services balance
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Services Surplus{lSvcBal.year ? ` (${lSvcBal.year})` : ""}
            </p>
            <p className={`text-2xl font-bold mt-1 ${
              lSvcBal.value != null && lSvcBal.value >= 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-500 dark:text-red-400"
            }`}>
              {fmtBn(lSvcBal.value)}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              IT, finance &amp; business services lead
            </p>
          </div>
        </div>

        {/* ── Charts ─────────────────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Chart 1: Exports & Imports volumes */}
          {volumeSeries.length > 0 && (
            <SeriesFilterChart
              series={volumeSeries}
              title="Exports & Imports — Goods and Services"
              subtitle="Merchandise and services trade flows (USD Billions, current prices)"
              source="World Bank"
              sourceUrl="https://data.worldbank.org/indicator/TX.VAL.MRCH.CD.WT?locations=IN"
              yAxisTitle="USD Bn"
              height={440}
            />
          )}

          {/* Chart 2: Trade Balance */}
          {balanceSeries.length > 0 && (
            <LineChart
              series={balanceSeries}
              title="Trade Balance — Goods and Services"
              subtitle="India runs a merchandise deficit offset by a large services surplus (USD Billions)"
              source="World Bank"
              sourceUrl="https://data.worldbank.org/indicator/TX.VAL.MRCH.CD.WT?locations=IN"
              yAxisTitle="USD Bn"
              height={380}
            />
          )}

          {/* Chart 3: Trade openness (% of GDP) */}
          {gdpPctSeries.length > 0 && (
            <LineChart
              series={gdpPctSeries}
              title="Trade Openness (% of GDP)"
              subtitle="Exports and imports of goods and services as a share of GDP"
              source="World Bank"
              sourceUrl="https://data.worldbank.org/indicator/NE.EXP.GNFS.ZS?locations=IN"
              yAxisTitle="% of GDP"
              height={360}
            />
          )}

          {/* Chart 4: FDI & Current Account */}
          {fdiCabSeries.length > 0 && (
            <LineChart
              series={fdiCabSeries}
              title="FDI Inflows & Current Account Balance"
              subtitle="Foreign direct investment net inflows and overall current account (USD Billions)"
              source="World Bank"
              sourceUrl="https://data.worldbank.org/indicator/BX.KLT.DINV.CD.WD?locations=IN"
              yAxisTitle="USD Bn"
              height={380}
            />
          )}

          {/* Chart 5: High-tech export share */}
          {hiTechSeries.length > 0 && (
            <LineChart
              series={hiTechSeries}
              title="High-Technology Export Share"
              subtitle="High-technology exports as a percentage of manufactured exports"
              source="World Bank"
              sourceUrl="https://data.worldbank.org/indicator/TX.VAL.TECH.MF.ZS?locations=IN"
              yAxisTitle="% of manufactured exports"
              height={340}
            />
          )}

        </div>
      </div>
    </>
  );
}
