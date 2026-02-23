import Head from "next/head";
import { useWorldBankIndicators } from "@/lib/hooks/useWorldBank";
import { WORLD_BANK_INDICATORS } from "@/lib/api/worldbank";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorDisplay from "@/components/ui/ErrorDisplay";

const GDP_INDICATORS = [
  WORLD_BANK_INDICATORS.GDP_GROWTH,
  WORLD_BANK_INDICATORS.GDP_CURRENT_USD,
  WORLD_BANK_INDICATORS.GDP_PER_CAPITA,
  WORLD_BANK_INDICATORS.GDP_PER_CAPITA_GROWTH,
];

export default function GDPGrowthDashboard() {
  const { data: series, isLoading, error, refetch } = useWorldBankIndicators(
    GDP_INDICATORS,
    { years: 35 }
  );

  if (isLoading) {
    return <LoadingSpinner message="Fetching GDP data from World Bank..." />;
  }

  if (error || !series || series.length === 0) {
    return (
      <ErrorDisplay
        message={
          error instanceof Error
            ? error.message
            : "Failed to fetch GDP data from World Bank API"
        }
        onRetry={() => refetch()}
      />
    );
  }

  // Find specific series
  const gdpGrowth = series.find(
    (s) => s.indicatorId === WORLD_BANK_INDICATORS.GDP_GROWTH
  );
  const gdpUSD = series.find(
    (s) => s.indicatorId === WORLD_BANK_INDICATORS.GDP_CURRENT_USD
  );
  const gdpPerCapita = series.find(
    (s) => s.indicatorId === WORLD_BANK_INDICATORS.GDP_PER_CAPITA
  );
  const gdpPerCapitaGrowth = series.find(
    (s) => s.indicatorId === WORLD_BANK_INDICATORS.GDP_PER_CAPITA_GROWTH
  );

  // Get latest values for summary cards
  const latestGrowth = gdpGrowth?.data[gdpGrowth.data.length - 1];
  const latestGDP = gdpUSD?.data[gdpUSD.data.length - 1];
  const latestPerCapita = gdpPerCapita?.data[gdpPerCapita.data.length - 1];

  return (
    <>
      <Head>
        <title>GDP & Growth | India Data Dashboard</title>
        <meta
          name="description"
          content="India's GDP growth rate, GDP in current USD, and per capita GDP from World Bank data."
        />
      </Head>

      <div>
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            GDP & National Accounts
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-300">
            India&apos;s Gross Domestic Product, growth rates, and per capita
            figures. Data from World Bank Development Indicators.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {latestGrowth && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                GDP Growth ({latestGrowth.date})
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {latestGrowth.value?.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Annual % change</p>
            </div>
          )}
          {latestGDP && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                GDP ({latestGDP.date})
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                ${((latestGDP.value || 0) / 1e12).toFixed(2)}T
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Current USD</p>
            </div>
          )}
          {latestPerCapita && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                GDP Per Capita ({latestPerCapita.date})
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                ${(latestPerCapita.value || 0).toLocaleString("en-US", {
                  maximumFractionDigits: 0,
                })}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Current USD</p>
            </div>
          )}
        </div>

        {/* Charts */}
        <div className="space-y-6">
          {/* GDP Growth Rate */}
          {gdpGrowth && (
            <LineChart
              series={[gdpGrowth]}
              title="India GDP Growth Rate (Annual %)"
              subtitle="Year-over-year change in real GDP"
              source="World Bank"
              sourceUrl="https://data.worldbank.org/indicator/NY.GDP.MKTP.KD.ZG?locations=IN"
              yAxisTitle="Growth Rate (%)"
              height={420}
            />
          )}

          {/* GDP in USD */}
          {gdpUSD && (
            <BarChart
              series={[
                {
                  ...gdpUSD,
                  indicator: "GDP (Current USD)",
                  data: gdpUSD.data.map((d) => ({
                    ...d,
                    value: d.value ? d.value / 1e9 : null, // Convert to billions
                  })),
                },
              ]}
              title="India GDP (Current USD, Billions)"
              subtitle="Nominal GDP at current market prices"
              source="World Bank"
              sourceUrl="https://data.worldbank.org/indicator/NY.GDP.MKTP.CD?locations=IN"
              yAxisTitle="GDP (Billion USD)"
              height={420}
            />
          )}

          {/* GDP Per Capita */}
          {gdpPerCapita && gdpPerCapitaGrowth && (
            <LineChart
              series={[gdpPerCapita, gdpPerCapitaGrowth]}
              title="GDP Per Capita"
              subtitle="Per capita GDP in current USD and growth rate"
              source="World Bank"
              sourceUrl="https://data.worldbank.org/indicator/NY.GDP.PCAP.CD?locations=IN"
              height={420}
            />
          )}
        </div>

        {/* Data source info */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200">
            About this data
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            GDP data is sourced from the World Bank Development Indicators API.
            Values represent India&apos;s national accounts aggregates. GDP
            growth rate uses constant local currency. For Indian fiscal year
            breakdowns and GVA by sector, see the MoSPI NAS integration
            (coming soon).
          </p>
        </div>
      </div>
    </>
  );
}
