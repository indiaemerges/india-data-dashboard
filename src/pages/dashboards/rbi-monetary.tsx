import Head from "next/head";
import { useRBIKeyRates, rbiRatesToSeries } from "@/lib/hooks/useRBIMonetary";
import { useWorldBankIndicator } from "@/lib/hooks/useWorldBank";
import LineChart from "@/components/charts/LineChart";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorDisplay from "@/components/ui/ErrorDisplay";
import type { DataSeries } from "@/lib/api/types";

const RBI_SOURCE = "RBI, Database on Indian Economy";
const RBI_URL = "https://data.rbi.org.in/DBIE/";
const WB_SOURCE = "World Bank, World Development Indicators";
const WB_URL = "https://data.worldbank.org/indicator/";

export default function RBIMonetaryDashboard() {
  const { data: ratesData, isLoading: ratesLoading, error: ratesError, refetch: refetchRates } =
    useRBIKeyRates();

  // World Bank live indicators
  const { data: forexSeries } = useWorldBankIndicator("FI.RES.TOTL.CD", { years: 30 });
  const { data: m3Series } = useWorldBankIndicator("FM.LBL.BMNY.ZG", { years: 30 });
  const { data: creditSeries } = useWorldBankIndicator("FS.AST.PRVT.GD.ZS", { years: 30 });

  if (ratesLoading) return <LoadingSpinner message="Loading RBI monetary data..." />;
  if (ratesError || !ratesData) {
    return (
      <ErrorDisplay
        message={
          ratesError instanceof Error
            ? ratesError.message
            : "Failed to load RBI key rates data"
        }
        onRetry={() => refetchRates()}
      />
    );
  }

  // Latest policy rate values for summary cards
  const latestIdx = ratesData.years.length - 1;
  const latestYear = ratesData.years[latestIdx];
  const latestRepo = ratesData.repoRate[latestIdx];
  const latestCRR = ratesData.crr[latestIdx];
  const latestSLR = ratesData.slr[latestIdx];

  // Latest forex reserves in USD billion (convert from raw USD)
  const latestForexRaw = forexSeries?.data
    .filter((d) => d.value !== null)
    .at(-1);
  const latestForexBn = latestForexRaw?.value != null
    ? latestForexRaw.value / 1e9
    : null;
  const latestForexYear = latestForexRaw?.date;

  // Chart series from RBI static data
  const allRatesSeries = rbiRatesToSeries(ratesData);
  const policyRatesSeries = allRatesSeries.filter(
    (s) => s.indicatorId === "RBI_REPO" || s.indicatorId === "RBI_SDF"
  );
  const reserveReqSeries = allRatesSeries.filter(
    (s) => s.indicatorId === "RBI_CRR" || s.indicatorId === "RBI_SLR"
  );

  // Convert forex to USD billion as a new series
  const forexBnSeries: DataSeries | undefined = forexSeries
    ? {
        ...forexSeries,
        indicator: "Forex Reserves",
        unit: "USD bn",
        data: forexSeries.data.map((d) => ({
          ...d,
          value: d.value != null ? d.value / 1e9 : null,
        })),
      }
    : undefined;

  // Override indicator labels for clarity
  const m3LabelledSeries: DataSeries | undefined = m3Series
    ? { ...m3Series, indicator: "Broad Money (M3) Growth", unit: "%" }
    : undefined;
  const creditLabelledSeries: DataSeries | undefined = creditSeries
    ? { ...creditSeries, indicator: "Credit to Private Sector", unit: "% of GDP" }
    : undefined;

  return (
    <>
      <Head>
        <title>RBI Monetary Policy | India Data Dashboard</title>
        <meta
          name="description"
          content="India's monetary policy indicators — RBI repo rate, CRR, SLR, forex reserves, and money supply data."
        />
      </Head>

      <div>
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">RBI Monetary Policy</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-300">
            Key policy rates, reserve requirements, foreign exchange reserves, and monetary
            aggregates. Policy rates from RBI DBIE; macro indicators from World Bank.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Repo Rate ({latestYear})
            </p>
            <p className="text-2xl font-bold text-blue-700 mt-1">
              {latestRepo != null ? `${latestRepo.toFixed(2)}%` : "—"}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">RBI benchmark policy rate</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              CRR ({latestYear})
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {latestCRR != null ? `${latestCRR.toFixed(2)}%` : "—"}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Cash Reserve Ratio</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              SLR ({latestYear})
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {latestSLR != null ? `${latestSLR.toFixed(2)}%` : "—"}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Statutory Liquidity Ratio</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Forex Reserves{latestForexYear ? ` (${latestForexYear})` : ""}
            </p>
            <p className="text-2xl font-bold text-green-700 mt-1">
              {latestForexBn != null ? `$${latestForexBn.toFixed(0)}bn` : "—"}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Total reserves incl. gold</p>
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-6">
          {/* Policy rates: Repo + SDF */}
          <LineChart
            series={policyRatesSeries}
            title="RBI Policy Rates"
            subtitle="Repo Rate and Reverse Repo / SDF (Standing Deposit Facility), end-of-year"
            source={RBI_SOURCE}
            sourceUrl={RBI_URL}
            yAxisTitle="Rate (%)"
            height={400}
          />

          {/* Reserve requirements: CRR + SLR */}
          <LineChart
            series={reserveReqSeries}
            title="Reserve Requirements"
            subtitle="Cash Reserve Ratio (CRR) and Statutory Liquidity Ratio (SLR), end-of-year"
            source={RBI_SOURCE}
            sourceUrl={RBI_URL}
            yAxisTitle="Rate (%)"
            height={400}
          />

          {/* Forex reserves */}
          {forexBnSeries && (
            <LineChart
              series={[forexBnSeries]}
              title="Foreign Exchange Reserves"
              subtitle="Total reserves including gold, USD billion"
              source={WB_SOURCE}
              sourceUrl={`${WB_URL}FI.RES.TOTL.CD`}
              yAxisTitle="USD billion"
              height={400}
            />
          )}

          {/* M3 growth + credit to private sector (dual axis auto-detected) */}
          {m3LabelledSeries && creditLabelledSeries && (
            <LineChart
              series={[m3LabelledSeries, creditLabelledSeries]}
              title="Money Supply & Bank Credit"
              subtitle="Broad money (M3) annual growth % and domestic credit to private sector (% of GDP)"
              source={WB_SOURCE}
              sourceUrl={`${WB_URL}FM.LBL.BMNY.ZG`}
              height={400}
            />
          )}
        </div>

        {/* Data source info */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200">About this data</h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            Policy rates (Repo Rate, CRR, SLR) reflect end-of-year values sourced from the{" "}
            <a
              href={RBI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-900 dark:hover:text-blue-100"
            >
              RBI Database on Indian Economy
            </a>
            . The Repo Rate was introduced in June 2000. The Standing Deposit Facility (SDF)
            replaced the Reverse Repo as the floor of the LAF corridor from April 2022. Forex
            reserves, broad money growth, and credit data are sourced from the{" "}
            <a
              href="https://data.worldbank.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-900 dark:hover:text-blue-100"
            >
              World Bank
            </a>
            .
          </p>
        </div>
      </div>
    </>
  );
}
