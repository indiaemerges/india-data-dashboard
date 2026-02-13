import Head from "next/head";
import { useWorldBankIndicators } from "@/lib/hooks/useWorldBank";
import { WORLD_BANK_INDICATORS } from "@/lib/api/worldbank";
import LineChart from "@/components/charts/LineChart";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorDisplay from "@/components/ui/ErrorDisplay";

export default function PopulationDashboard() {
  const { data: series, isLoading, error, refetch } = useWorldBankIndicators(
    [
      WORLD_BANK_INDICATORS.POPULATION,
      WORLD_BANK_INDICATORS.POPULATION_GROWTH,
      WORLD_BANK_INDICATORS.URBAN_POPULATION_PCT,
      WORLD_BANK_INDICATORS.LIFE_EXPECTANCY,
    ],
    { years: 50 }
  );

  if (isLoading) return <LoadingSpinner message="Fetching population data..." />;
  if (error || !series?.length) {
    return <ErrorDisplay message={error instanceof Error ? error.message : "Failed to fetch data"} onRetry={() => refetch()} />;
  }

  const population = series.find((s) => s.indicatorId === WORLD_BANK_INDICATORS.POPULATION);
  const popGrowth = series.find((s) => s.indicatorId === WORLD_BANK_INDICATORS.POPULATION_GROWTH);
  const urban = series.find((s) => s.indicatorId === WORLD_BANK_INDICATORS.URBAN_POPULATION_PCT);
  const lifeExp = series.find((s) => s.indicatorId === WORLD_BANK_INDICATORS.LIFE_EXPECTANCY);

  const latestPop = population?.data[population.data.length - 1];

  return (
    <>
      <Head><title>Population & Demographics | India Data Dashboard</title></Head>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Population & Demographics</h1>
        <p className="text-gray-600 mb-6">India&apos;s population trends, urbanization, and life expectancy.</p>

        {latestPop && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 inline-block">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Population ({latestPop.date})</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{((latestPop.value || 0) / 1e9).toFixed(2)} Billion</p>
          </div>
        )}

        <div className="space-y-6">
          {population && (
            <LineChart
              series={[{ ...population, indicator: "Total Population", data: population.data.map(d => ({ ...d, value: d.value ? d.value / 1e9 : null })) }]}
              title="India Population (Billions)"
              source="World Bank"
              yAxisTitle="Population (Billions)"
              height={400}
            />
          )}
          {popGrowth && urban && (
            <LineChart series={[popGrowth, urban]} title="Population Growth & Urbanization" source="World Bank" yAxisTitle="%" height={400} />
          )}
          {lifeExp && (
            <LineChart series={[lifeExp]} title="Life Expectancy at Birth" source="World Bank" yAxisTitle="Years" height={400} />
          )}
        </div>
      </div>
    </>
  );
}
