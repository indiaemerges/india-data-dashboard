import Head from "next/head";
import {
  useRBIPolicyRates,
  useRBIForexReserves,
  rbiPolicyRatesToSeries,
  rbiForexToSeries,
} from "@/lib/hooks/useRBIMonetary";
import LineChart from "@/components/charts/LineChart";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorDisplay from "@/components/ui/ErrorDisplay";
import type { DataSeries } from "@/lib/api/types";

const RBI_SOURCE = "RBI, Database on Indian Economy";
const RBI_URL = "https://data.rbi.org.in/DBIE/";

export default function RBIMonetaryDashboard() {
  const {
    data: ratesData,
    isLoading: ratesLoading,
    error: ratesError,
    refetch: refetchRates,
  } = useRBIPolicyRates();

  const {
    data: forexData,
    isLoading: forexLoading,
  } = useRBIForexReserves();

  if (ratesLoading || forexLoading) {
    return <LoadingSpinner message="Loading RBI monetary data..." />;
  }
  if (ratesError || !ratesData) {
    return (
      <ErrorDisplay
        message={
          ratesError instanceof Error
            ? ratesError.message
            : "Failed to load RBI policy rates data"
        }
        onRetry={() => refetchRates()}
      />
    );
  }

  // Build chart series from event-level data
  const allRatesSeries = rbiPolicyRatesToSeries(ratesData);
  const policyRatesSeries = allRatesSeries.filter(
    (s) => s.indicatorId === "RBI_REPO" || s.indicatorId === "RBI_SDF"
  );
  const reserveReqSeries = allRatesSeries.filter(
    (s) => s.indicatorId === "RBI_CRR" || s.indicatorId === "RBI_SLR"
  );

  // Latest policy rate values — skip the trailing sentinel (2026-03-01) to show
  // the actual last decision date, not the extend-to-today placeholder.
  const isSentinel = (d: { date: string }) => d.date === "2026-03-01";
  const latestRepo = ratesData.repoRate.findLast((d) => !isSentinel(d));
  const latestCRR  = ratesData.crr.findLast((d) => !isSentinel(d));
  const latestSLR  = ratesData.slr.findLast((d) => !isSentinel(d));

  // Forex series from static monthly data
  const forexSeries: DataSeries | undefined = forexData
    ? rbiForexToSeries(forexData)
    : undefined;

  // Latest forex value
  const latestForex = forexData?.monthly.at(-1);

  return (
    <>
      <Head>
        <title>RBI Monetary Policy | India Data Dashboard</title>
        <meta
          name="description"
          content="India's monetary policy indicators — RBI repo rate, CRR, SLR, and forex reserves."
        />
      </Head>

      <div>
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">RBI Monetary Policy</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-300">
            Key policy rates, reserve requirements, and foreign exchange reserves. Policy rates
            shown at actual decision dates (MPC era exact, pre-2016 approximate). Monthly forex
            data from RBI.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Repo Rate
            </p>
            <p className="text-2xl font-bold text-blue-700 mt-1">
              {latestRepo != null ? `${latestRepo.value.toFixed(2)}%` : "—"}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {latestRepo ? `Since ${latestRepo.date}` : "RBI benchmark policy rate"}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              CRR
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {latestCRR != null ? `${latestCRR.value.toFixed(2)}%` : "—"}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {latestCRR ? `Since ${latestCRR.date}` : "Cash Reserve Ratio"}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              SLR
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {latestSLR != null ? `${latestSLR.value.toFixed(2)}%` : "—"}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {latestSLR ? `Since ${latestSLR.date}` : "Statutory Liquidity Ratio"}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Forex Reserves
            </p>
            <p className="text-2xl font-bold text-green-700 mt-1">
              {latestForex != null ? `$${latestForex.value.toFixed(0)}bn` : "—"}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {latestForex ? latestForex.date : "Total reserves incl. gold"}
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-6">
          {/* Policy rates: Repo + SDF (step chart) */}
          <LineChart
            series={policyRatesSeries}
            lineShape="hv"
            showMarkers={false}
            title="RBI Policy Rates"
            subtitle="Repo Rate and Standing Deposit Facility (SDF) / Reverse Repo — actual decision dates"
            source={RBI_SOURCE}
            sourceUrl={RBI_URL}
            yAxisTitle="Rate (%)"
            height={400}
          />

          {/* Reserve requirements: CRR + SLR (step chart) */}
          <LineChart
            series={reserveReqSeries}
            lineShape="hv"
            showMarkers={false}
            title="Reserve Requirements"
            subtitle="Cash Reserve Ratio (CRR) and Statutory Liquidity Ratio (SLR) — actual change dates"
            source={RBI_SOURCE}
            sourceUrl={RBI_URL}
            yAxisTitle="Rate (%)"
            height={400}
          />

          {/* Forex reserves — monthly line chart */}
          {forexSeries && (
            <LineChart
              series={[forexSeries]}
              showMarkers={false}
              title="Foreign Exchange Reserves"
              subtitle="Total reserves including gold, SDRs, and reserve tranche — monthly, USD billion"
              source={RBI_SOURCE}
              sourceUrl={RBI_URL}
              yAxisTitle="USD billion"
              height={400}
            />
          )}
        </div>

        {/* Data source info */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200">About this data</h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            Policy rates (Repo Rate, CRR, SLR) are shown at actual change-event dates. The
            Monetary Policy Committee (MPC) era begins October 2016; pre-MPC dates are
            approximate. The Standing Deposit Facility (SDF) replaced the Reverse Repo as the
            floor of the LAF corridor from April 2022. Foreign exchange reserve data is monthly
            from the{" "}
            <a
              href={RBI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-900 dark:hover:text-blue-100"
            >
              RBI Database on Indian Economy
            </a>
            ; pre-2016 months are linearly interpolated between known year-end anchor points.
          </p>
        </div>
      </div>
    </>
  );
}
