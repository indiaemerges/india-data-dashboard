import Head from "next/head";
import { useWorldBankIndicators } from "@/lib/hooks/useWorldBank";
import { WORLD_BANK_INDICATORS } from "@/lib/api/worldbank";
import LineChart from "@/components/charts/LineChart";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorDisplay from "@/components/ui/ErrorDisplay";

export default function InflationDashboard() {
  const { data: series, isLoading, error, refetch } = useWorldBankIndicators(
    [WORLD_BANK_INDICATORS.INFLATION_CPI, WORLD_BANK_INDICATORS.INFLATION_GDP_DEFLATOR],
    { years: 35 }
  );

  if (isLoading) return <LoadingSpinner message="Fetching inflation data..." />;
  if (error || !series?.length) {
    return (
      <ErrorDisplay
        message={error instanceof Error ? error.message : "Failed to fetch inflation data"}
        onRetry={() => refetch()}
      />
    );
  }

  const latestCPI = series[0]?.data[series[0].data.length - 1];

  return (
    <>
      <Head>
        <title>Inflation (CPI & WPI) | India Data Dashboard</title>
      </Head>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Inflation (CPI & WPI)
        </h1>
        <p className="text-gray-600 mb-6">
          Consumer and Wholesale Price Index trends for India.
        </p>

        {latestCPI && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 inline-block">
            <p className="text-xs text-gray-500 uppercase tracking-wider">
              CPI Inflation ({latestCPI.date})
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {latestCPI.value?.toFixed(1)}%
            </p>
          </div>
        )}

        <LineChart
          series={series}
          title="India Inflation Rate"
          subtitle="Consumer Price Index and GDP Deflator based inflation"
          source="World Bank"
          sourceUrl="https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG?locations=IN"
          yAxisTitle="Inflation Rate (%)"
          height={450}
        />

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-sm text-blue-700">
            Detailed CPI breakdown by commodity group (600+ items) and WPI data
            will be integrated from MoSPI CPI and WPI APIs in a future update.
          </p>
        </div>
      </div>
    </>
  );
}
