import Head from "next/head";
import { useIIPAnnualData, iipToSeries } from "@/lib/hooks/useMospiIIP";
import LineChart from "@/components/charts/LineChart";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorDisplay from "@/components/ui/ErrorDisplay";

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

export default function IndustrialDashboard() {
  const { data, isLoading, error, refetch } = useIIPAnnualData();

  if (isLoading) {
    return <LoadingSpinner message="Loading IIP data..." />;
  }

  if (error || !data) {
    return (
      <ErrorDisplay
        message={
          error instanceof Error
            ? error.message
            : "Failed to load Index of Industrial Production data"
        }
        onRetry={() => refetch()}
      />
    );
  }

  // Latest year is the last element in the years array (oldest-to-newest order)
  const latestYear = data.years[data.years.length - 1];
  const latestIdx = data.years.length - 1;

  const generalIndex = data.sectoral["General"]?.index[latestIdx];
  const generalGrowth = data.sectoral["General"]?.growth[latestIdx];
  const mfgIndex = data.sectoral["Manufacturing"]?.index[latestIdx];
  const mfgGrowth = data.sectoral["Manufacturing"]?.growth[latestIdx];

  // Build chart series
  const sectoralIndexSeries = iipToSeries(data, "sectoral", SECTORAL_CATEGORIES, "index");
  const sectoralGrowthSeries = iipToSeries(data, "sectoral", SECTORAL_CATEGORIES, "growth");
  const useBasedIndexSeries = iipToSeries(data, "useBased", USE_BASED_CATEGORIES, "index");
  const useBasedGrowthSeries = iipToSeries(data, "useBased", USE_BASED_CATEGORIES, "growth");

  return (
    <>
      <Head>
        <title>Industrial Production (IIP) | India Data Dashboard</title>
        <meta
          name="description"
          content="India's Index of Industrial Production — sectoral and use-based classification trends from MoSPI."
        />
      </Head>

      <div>
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Industrial Production (IIP)
          </h1>
          <p className="mt-1 text-gray-600">
            Index of Industrial Production tracks monthly and annual changes in
            Indian industry across mining, manufacturing, and electricity
            sectors. Base year: {data.baseYear}. Data from MoSPI.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {generalIndex != null && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                General IIP Index ({latestYear})
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {generalIndex.toFixed(1)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Base: {data.baseYear} = 100
              </p>
            </div>
          )}
          {generalGrowth != null && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                General Growth ({latestYear})
              </p>
              <p
                className={`text-2xl font-bold mt-1 ${
                  generalGrowth >= 0 ? "text-green-700" : "text-red-700"
                }`}
              >
                {generalGrowth >= 0 ? "+" : ""}
                {generalGrowth.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-400 mt-1">Year-on-year</p>
            </div>
          )}
          {mfgIndex != null && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Manufacturing Index ({latestYear})
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {mfgIndex.toFixed(1)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Base: {data.baseYear} = 100
              </p>
            </div>
          )}
          {mfgGrowth != null && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Manufacturing Growth ({latestYear})
              </p>
              <p
                className={`text-2xl font-bold mt-1 ${
                  mfgGrowth >= 0 ? "text-green-700" : "text-red-700"
                }`}
              >
                {mfgGrowth >= 0 ? "+" : ""}
                {mfgGrowth.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-400 mt-1">Year-on-year</p>
            </div>
          )}
        </div>

        {/* Charts */}
        <div className="space-y-6">
          {/* Sectoral Index */}
          {sectoralIndexSeries.length > 0 && (
            <LineChart
              series={sectoralIndexSeries}
              title="IIP Index — Sectoral"
              subtitle="General, Mining, Manufacturing, and Electricity index values over time"
              source={SOURCE_LABEL}
              sourceUrl={SOURCE_URL}
              yAxisTitle="Index"
              height={420}
            />
          )}

          {/* Sectoral Growth */}
          {sectoralGrowthSeries.length > 0 && (
            <LineChart
              series={sectoralGrowthSeries}
              title="IIP Growth Rate — Sectoral"
              subtitle="Year-on-year growth rates for General, Mining, Manufacturing, and Electricity"
              source={SOURCE_LABEL}
              sourceUrl={SOURCE_URL}
              yAxisTitle="Growth Rate (%)"
              height={420}
            />
          )}

          {/* Use-based Index */}
          {useBasedIndexSeries.length > 0 && (
            <LineChart
              series={useBasedIndexSeries}
              title="IIP Index — Use-based Classification"
              subtitle="Primary Goods, Capital Goods, Intermediate Goods, Infrastructure/Construction, Consumer Durables & Non-durables"
              source={SOURCE_LABEL}
              sourceUrl={SOURCE_URL}
              yAxisTitle="Index"
              height={420}
            />
          )}

          {/* Use-based Growth */}
          {useBasedGrowthSeries.length > 0 && (
            <LineChart
              series={useBasedGrowthSeries}
              title="IIP Growth Rate — Use-based Classification"
              subtitle="Year-on-year growth rates by use-based category"
              source={SOURCE_LABEL}
              sourceUrl={SOURCE_URL}
              yAxisTitle="Growth Rate (%)"
              height={420}
            />
          )}
        </div>

        {/* Data source info */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="text-sm font-semibold text-blue-900">
            About this data
          </h3>
          <p className="text-sm text-blue-700 mt-1">
            The Index of Industrial Production (IIP) is compiled and published
            monthly by the Ministry of Statistics and Programme Implementation
            (MoSPI) with base year {data.baseYear}. It measures short-term
            changes in the volume of production of a basket of industrial
            products during a given period with respect to a chosen base period.
            The index covers mining, manufacturing (22 industry groups per
            NIC-2008), and electricity sectors. Use-based classification groups
            items into Primary Goods, Capital Goods, Intermediate Goods,
            Infrastructure/Construction Goods, Consumer Durables, and Consumer
            Non-durables.
          </p>
          <p className="text-sm text-blue-700 mt-2">
            Source:{" "}
            <a
              href={SOURCE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-900"
            >
              {SOURCE_LABEL}
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
