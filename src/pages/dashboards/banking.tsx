import Head from "next/head";
import {
  useRBIBankingData,
  bankingCreditDepositSeries,
  bankingGrowthSeries,
  bankingCreditToGDPSeries,
  bankingCDRatioSeries,
  bankingGNPASeries,
  bankingGNPABySectorSeries,
  bankingCRARSeries,
  bankingCreditGrowthByTypeSeries,
  bankingMarketShareSeries,
  bankingSectoralSeries,
} from "@/lib/hooks/useRBIBanking";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorDisplay from "@/components/ui/ErrorDisplay";

const SOURCE = "RBI Handbook of Statistics on Indian Economy; RBI Financial Stability Reports";
const SOURCE_URL = "https://dbie.rbi.org.in/";

export default function BankingDashboard() {
  const { data, isLoading, error, refetch } = useRBIBankingData();

  if (isLoading) return <LoadingSpinner message="Loading banking & credit data..." />;
  if (error || !data) {
    return (
      <ErrorDisplay
        message={error instanceof Error ? error.message : "Failed to load banking data"}
        onRetry={() => refetch()}
      />
    );
  }

  // Latest values
  const latestYear = data.years.at(-1)!;
  const latestCredit = data.credit.at(-1)!;
  const latestCreditGrowth = data.creditGrowth.at(-1);
  const latestGNPA = data.gnpa.ratio.at(-1)!;
  const latestCDRatio = data.cdRatio.at(-1)!;

  // Series
  const creditDepositSeries = bankingCreditDepositSeries(data);
  const growthSeries = bankingGrowthSeries(data);
  const creditToGDPSeries = bankingCreditToGDPSeries(data);
  const cdRatioSeries = bankingCDRatioSeries(data);
  const gnpaSeries = bankingGNPASeries(data);
  const gnpaBySectorSeries = bankingGNPABySectorSeries(data);
  const crarSeries = bankingCRARSeries(data);
  const creditGrowthByTypeSeries = bankingCreditGrowthByTypeSeries(data);
  const marketShareSeries = bankingMarketShareSeries(data);
  const sectoralSeries = bankingSectoralSeries(data);

  return (
    <>
      <Head>
        <title>Banking &amp; Credit | India Data Dashboard</title>
        <meta
          name="description"
          content="India's banking sector — bank credit, deposits, NPA ratio, sectoral credit deployment, and credit-to-GDP from RBI."
        />
      </Head>

      <div>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Banking &amp; Credit
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-300">
            Scheduled Commercial Bank credit and deposits, credit growth, Gross NPA ratio, sectoral
            credit deployment, and credit-to-GDP. Annual data sourced from RBI DBIE and Financial
            Stability Reports.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Bank Credit
            </p>
            <p className="text-2xl font-bold text-blue-700 mt-1">
              ₹{latestCredit.toFixed(1)} L Cr
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Non-food credit, {latestYear}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Credit Growth
            </p>
            <p className={`text-2xl font-bold mt-1 ${latestCreditGrowth != null && latestCreditGrowth >= 10 ? "text-green-700" : "text-gray-900 dark:text-white"}`}>
              {latestCreditGrowth != null ? `${latestCreditGrowth.toFixed(1)}%` : "—"}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              YoY, {latestYear}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Gross NPA Ratio
            </p>
            <p className={`text-2xl font-bold mt-1 ${latestGNPA <= 4 ? "text-green-700" : latestGNPA <= 7 ? "text-yellow-600" : "text-red-600"}`}>
              {latestGNPA.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              % of gross advances, {data.gnpa.years.at(-1)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              CD Ratio
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {latestCDRatio.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Credit-to-Deposit ratio, {latestYear}
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-6">
          {/* Credit & Deposits */}
          <LineChart
            series={creditDepositSeries}
            title="Bank Credit &amp; Deposits"
            subtitle="Scheduled Commercial Banks — non-food credit and total deposits (₹ lakh crore, end of March)"
            source={SOURCE}
            sourceUrl={SOURCE_URL}
            yAxisTitle="₹ Lakh Crore"
            height={420}
            showMarkers={false}
          />

          {/* Credit & Deposit Growth */}
          <LineChart
            series={growthSeries}
            title="Credit &amp; Deposit Growth"
            subtitle="Year-on-year growth in bank credit and deposits (%)"
            source={SOURCE}
            sourceUrl={SOURCE_URL}
            yAxisTitle="Growth (%)"
            height={380}
            showMarkers={false}
          />

          {/* Credit growth by bank type */}
          <LineChart
            series={creditGrowthByTypeSeries}
            title="Credit Growth: PSB vs Private Banks"
            subtitle="YoY credit growth (%) — private banks pulled ahead during the PSB NPA clean-up (2015–20), then PSBs rebounded post-recapitalisation"
            source={SOURCE}
            sourceUrl={SOURCE_URL}
            yAxisTitle="Growth (%)"
            height={380}
            showMarkers={false}
          />

          {/* Market share */}
          <LineChart
            series={marketShareSeries}
            title="Share of SCB Credit by Bank Group"
            subtitle="PSBs' share of total bank credit (%) — declined from ~73% in 2007 to ~55% today as private banks captured market"
            source={SOURCE}
            sourceUrl={SOURCE_URL}
            yAxisTitle="% of SCB credit"
            height={360}
            showMarkers={false}
          />

          {/* Sectoral credit — stacked bar */}
          <BarChart
            series={sectoralSeries}
            title="Sectoral Credit Deployment"
            subtitle="Share of non-food credit by sector (%) — personal loans rising, industry declining"
            source={SOURCE}
            sourceUrl={SOURCE_URL}
            yAxisTitle="% of non-food credit"
            barMode="stack"
            height={400}
          />

          {/* GNPA by bank type */}
          <LineChart
            series={gnpaBySectorSeries}
            title="Gross NPA Ratio — Public vs Private Banks"
            subtitle="PSBs peaked at 14.6% in 2017-18; private banks stayed below 5% throughout"
            source={SOURCE}
            sourceUrl={SOURCE_URL}
            yAxisTitle="GNPA (%)"
            height={380}
            showMarkers={false}
          />

          {/* Capital Adequacy */}
          <LineChart
            series={crarSeries}
            title="Capital Adequacy Ratio (CRAR)"
            subtitle="Basel III CRAR (%) — regulatory minimum 11.5% (incl. capital conservation buffer). PSBs were dangerously close in 2013–15 before govt recapitalisation."
            source="RBI Financial Stability Reports; Trend and Progress of Banking in India"
            sourceUrl={SOURCE_URL}
            yAxisTitle="CRAR (%)"
            height={380}
            showMarkers={false}
          />

          {/* Credit-to-GDP */}
          <LineChart
            series={[creditToGDPSeries]}
            title="Credit-to-GDP Ratio"
            subtitle="Bank credit as % of nominal GDP — depth of financial intermediation"
            source={SOURCE}
            sourceUrl={SOURCE_URL}
            yAxisTitle="% of GDP"
            height={360}
            showMarkers={false}
          />

          {/* CD Ratio */}
          <LineChart
            series={[cdRatioSeries]}
            title="Credit-to-Deposit (CD) Ratio"
            subtitle="Ratio of bank credit to deposits (%) — above 80% indicates tight liquidity"
            source={SOURCE}
            sourceUrl={SOURCE_URL}
            yAxisTitle="%"
            height={360}
            showMarkers={false}
          />
        </div>

        {/* About */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200">About this data</h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            Credit and deposit data covers Scheduled Commercial Banks (SCBs) at end of March each
            fiscal year. Non-food credit excludes food credit extended by banks to the Food
            Corporation of India and state agencies. GNPA ratios are from RBI Financial Stability
            Reports (bi-annual) and reflect the March position. Sectoral credit shares are from the
            RBI&apos;s Sectoral Deployment of Bank Credit release. Credit-to-GDP uses nominal GDP at
            current prices from MoSPI NAS.{" "}
            <a
              href={SOURCE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-900 dark:hover:text-blue-100"
            >
              RBI Database on Indian Economy
            </a>
            .
          </p>
        </div>
      </div>
    </>
  );
}
