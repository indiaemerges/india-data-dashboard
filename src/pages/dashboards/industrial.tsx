import Head from "next/head";
import {
  useIIPAnnualData,
  useIIPMonthlyData,
  iipToSeries,
  iipMonthlyToSeries,
  type IIPMonthField,
} from "@/lib/hooks/useMospiIIP";
import LineChart from "@/components/charts/LineChart";
import SeriesFilterChart from "@/components/charts/SeriesFilterChart";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorDisplay from "@/components/ui/ErrorDisplay";
import type { DataSeries } from "@/lib/api/types";

// ── Category lists ───────────────────────────────────────────────────────────

const MONTHLY_SECTORAL: IIPMonthField[] = [
  "general",
  "mining",
  "manufacturing",
  "electricity",
];
const MONTHLY_USE_BASED: IIPMonthField[] = [
  "primaryGoods",
  "capitalGoods",
  "intermediateGoods",
  "infraGoods",
  "consumerDurables",
  "consumerNonDurables",
];
const SECTORAL_CATEGORIES = ["General", "Mining", "Manufacturing", "Electricity"];
const USE_BASED_CATEGORIES = [
  "Primary Goods",
  "Capital Goods",
  "Intermediate Goods",
  "Infrastructure/ Construction Goods",
  "Consumer Durables",
  "Consumer Non-durables",
];

const SOURCE_LABEL = "MoSPI, Index of Industrial Production";
const SOURCE_URL =
  "https://www.mospi.gov.in/publication/index-industrial-production";

// ── Moving-average helper ────────────────────────────────────────────────────

/**
 * Return a new DataSeries whose values are the N-month trailing moving average
 * of the supplied series. Points with fewer than N predecessors are null.
 */
function computeMA(series: DataSeries, window: number): DataSeries {
  return {
    ...series,
    indicator: `${series.indicator} (${window}-mo MA)`,
    indicatorId: `${series.indicatorId}_MA${window}`,
    data: series.data.map((pt, i) => {
      if (i < window - 1) return { date: pt.date, value: null };
      const slice = series.data.slice(i - window + 1, i + 1);
      const vals = slice.map((p) => p.value).filter((v) => v !== null) as number[];
      if (vals.length < window) return { date: pt.date, value: null };
      return {
        date: pt.date,
        value: Math.round((vals.reduce((s, v) => s + v, 0) / window) * 10) / 10,
      };
    }),
  };
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export default function IndustrialDashboard() {
  const {
    data: annualData,
    isLoading: annualLoading,
    error: annualError,
    refetch: refetchAnnual,
  } = useIIPAnnualData();

  const {
    data: monthlyData,
    isLoading: monthlyLoading,
  } = useIIPMonthlyData();

  if (annualLoading || monthlyLoading) {
    return <LoadingSpinner message="Loading IIP data..." />;
  }
  if (annualError || !annualData) {
    return (
      <ErrorDisplay
        message={
          annualError instanceof Error
            ? annualError.message
            : "Failed to load Index of Industrial Production data"
        }
        onRetry={() => refetchAnnual()}
      />
    );
  }

  // ── Summary cards from latest monthly data ──────────────────────────────

  const latestMonth = monthlyData?.monthly.at(-1);
  const prevMonth   = monthlyData?.monthly.at(-2); // for month-over-month context

  // Fallback to annual when monthly not available
  const latestAnnualYear = annualData.years[annualData.years.length - 1];
  const latestAnnualIdx  = annualData.years.length - 1;
  const annualGeneralIndex  = annualData.sectoral["General"]?.index[latestAnnualIdx];
  const annualGeneralGrowth = annualData.sectoral["General"]?.growth[latestAnnualIdx];
  const annualMfgIndex      = annualData.sectoral["Manufacturing"]?.index[latestAnnualIdx];
  const annualMfgGrowth     = annualData.sectoral["Manufacturing"]?.growth[latestAnnualIdx];

  const generalIndex  = latestMonth?.general.index   ?? annualGeneralIndex;
  const generalGrowth = latestMonth?.general.growth   ?? annualGeneralGrowth;
  const mfgIndex      = latestMonth?.manufacturing.index  ?? annualMfgIndex;
  const mfgGrowth     = latestMonth?.manufacturing.growth ?? annualMfgGrowth;
  const cardPeriod    = latestMonth?.label ?? latestAnnualYear;

  // ── Monthly series ──────────────────────────────────────────────────────

  const monthlyGeneralSeries = monthlyData
    ? iipMonthlyToSeries(monthlyData, ["general"], "index")[0]
    : null;

  const generalWithMA = monthlyGeneralSeries
    ? [monthlyGeneralSeries, computeMA(monthlyGeneralSeries, 12)]
    : [];

  const monthlySectoralGrowth = monthlyData
    ? iipMonthlyToSeries(monthlyData, MONTHLY_SECTORAL, "growth")
    : [];

  const monthlyUseBasedGrowth = monthlyData
    ? iipMonthlyToSeries(monthlyData, MONTHLY_USE_BASED, "growth")
    : [];

  // ── Annual series (kept as reference) ──────────────────────────────────

  const sectoralIndexSeries  = iipToSeries(annualData, "sectoral", SECTORAL_CATEGORIES, "index");
  const useBasedGrowthSeries = iipToSeries(annualData, "useBased", USE_BASED_CATEGORIES, "growth");

  return (
    <>
      <Head>
        <title>Industrial Production (IIP) | India Data Dashboard</title>
        <meta
          name="description"
          content="India's Index of Industrial Production — monthly and annual trends from MoSPI."
        />
      </Head>

      <div>
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Industrial Production (IIP)
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-300">
            Monthly Index of Industrial Production (IIP, base {annualData.baseYear}) across mining,
            manufacturing, and electricity sectors. Data from MoSPI.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {generalIndex != null && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                General IIP
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {generalIndex.toFixed(1)}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {cardPeriod} · Base {annualData.baseYear}=100
              </p>
            </div>
          )}
          {generalGrowth != null && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                General Growth
              </p>
              <p
                className={`text-2xl font-bold mt-1 ${
                  generalGrowth >= 0 ? "text-green-700" : "text-red-700"
                }`}
              >
                {generalGrowth >= 0 ? "+" : ""}
                {generalGrowth.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {cardPeriod} · Year-on-year
              </p>
            </div>
          )}
          {mfgIndex != null && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Manufacturing IIP
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {mfgIndex.toFixed(1)}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {cardPeriod} · Base {annualData.baseYear}=100
              </p>
            </div>
          )}
          {mfgGrowth != null && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Manufacturing Growth
              </p>
              <p
                className={`text-2xl font-bold mt-1 ${
                  mfgGrowth >= 0 ? "text-green-700" : "text-red-700"
                }`}
              >
                {mfgGrowth >= 0 ? "+" : ""}
                {mfgGrowth.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {cardPeriod} · Year-on-year
              </p>
            </div>
          )}
        </div>

        {/* ── Monthly charts (primary) ─────────────────────────────────── */}
        <div className="space-y-6">

          {/* General IIP trend + 12-month moving average */}
          {generalWithMA.length > 0 && (
            <LineChart
              series={generalWithMA}
              showMarkers={false}
              title="General IIP — Monthly Trend"
              subtitle="Monthly index level with 12-month moving average (smooths seasonal noise)"
              source={SOURCE_LABEL}
              sourceUrl={SOURCE_URL}
              yAxisTitle="Index (2011-12=100)"
              height={420}
            />
          )}

          {/* Monthly sectoral growth rates */}
          {monthlySectoralGrowth.length > 0 && (
            <SeriesFilterChart
              series={monthlySectoralGrowth}
              showMarkers={false}
              title="IIP Growth Rate — Sectoral (Monthly)"
              subtitle="Year-on-year growth for General, Mining, Manufacturing, and Electricity — COVID-19 shock and recovery clearly visible"
              source={SOURCE_LABEL}
              sourceUrl={SOURCE_URL}
              yAxisTitle="YoY Growth (%)"
              height={420}
            />
          )}

          {/* Monthly use-based growth rates */}
          {monthlyUseBasedGrowth.length > 0 && (
            <SeriesFilterChart
              series={monthlyUseBasedGrowth}
              showMarkers={false}
              title="IIP Growth Rate — Use-based Classification (Monthly)"
              subtitle="Capital Goods leads the investment cycle; Consumer Durables tracks household demand"
              source={SOURCE_LABEL}
              sourceUrl={SOURCE_URL}
              yAxisTitle="YoY Growth (%)"
              height={420}
            />
          )}

          {/* ── Annual reference charts ──────────────────────────────── */}
          <div className="pt-2">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Annual Reference
            </h2>
            <div className="space-y-6">
              {/* Annual sectoral index — long-run structural trend */}
              {sectoralIndexSeries.length > 0 && (
                <LineChart
                  series={sectoralIndexSeries}
                  title="IIP Index — Sectoral (Annual Average)"
                  subtitle="Annual average index levels showing long-run structural growth in each sector"
                  source={SOURCE_LABEL}
                  sourceUrl={SOURCE_URL}
                  yAxisTitle="Index (2011-12=100)"
                  height={380}
                />
              )}

              {/* Annual use-based growth rates */}
              {useBasedGrowthSeries.length > 0 && (
                <SeriesFilterChart
                  series={useBasedGrowthSeries}
                  title="IIP Growth Rate — Use-based (Annual Average)"
                  subtitle="Annual average growth rates by use-based category"
                  source={SOURCE_LABEL}
                  sourceUrl={SOURCE_URL}
                  yAxisTitle="Growth Rate (%)"
                  height={380}
                />
              )}
            </div>
          </div>
        </div>

        {/* Data source info */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200">
            About this data
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            The Index of Industrial Production (IIP) is compiled and published monthly by MoSPI with
            base year {annualData.baseYear}. Monthly data covers April 2012 onwards (calendar year
            months). IIP is typically released with a ~6-week lag, so the latest month shown reflects
            production from approximately 6 weeks prior. The 12-month moving average smooths
            seasonal fluctuations to reveal the underlying trend. Use-based classification groups
            items into Primary Goods, Capital Goods, Intermediate Goods,
            Infrastructure/Construction Goods, Consumer Durables, and Consumer Non-durables.
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
            Source:{" "}
            <a
              href={SOURCE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-900 dark:hover:text-blue-100"
            >
              {SOURCE_LABEL}
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
