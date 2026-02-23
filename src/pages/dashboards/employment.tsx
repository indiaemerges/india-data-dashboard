import Head from "next/head";
import {
  usePLFSAnnualData,
  plfsGenderSeries,
  plfsUrSectorSeries,
} from "@/lib/hooks/useMospiPLFS";
import LineChart from "@/components/charts/LineChart";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorDisplay from "@/components/ui/ErrorDisplay";

const SOURCE_LABEL = "MoSPI, Periodic Labour Force Survey";
const SOURCE_URL = "https://www.mospi.gov.in/publication/periodic-labour-force-survey-plfs-1";

export default function EmploymentDashboard() {
  const { data, isLoading, error, refetch } = usePLFSAnnualData();

  if (isLoading) {
    return <LoadingSpinner message="Loading PLFS data..." />;
  }

  if (error || !data) {
    return (
      <ErrorDisplay
        message={
          error instanceof Error
            ? error.message
            : "Failed to load Periodic Labour Force Survey data"
        }
        onRetry={() => refetch()}
      />
    );
  }

  const latestIdx = data.years.length - 1;
  const latestYear = data.years[latestIdx];
  const latestUR = data.ur.person[latestIdx];
  const latestLFPR = data.lfpr.person[latestIdx];
  const latestWPR = data.wpr.person[latestIdx];
  const latestFemaleLFPR = data.lfpr.female[latestIdx];

  // Build chart series
  const urGenderSeries = plfsGenderSeries(data, "ur", ["male", "female", "person"]);
  const urSectorSeries = plfsUrSectorSeries(data);
  const lfprGenderSeries = plfsGenderSeries(data, "lfpr", ["male", "female", "person"]);
  const wprGenderSeries = plfsGenderSeries(data, "wpr", ["male", "female", "person"]);

  return (
    <>
      <Head>
        <title>Employment & Labour (PLFS) | India Data Dashboard</title>
        <meta
          name="description"
          content="India's employment indicators from the Periodic Labour Force Survey — unemployment rate, labour force participation, and worker population ratio."
        />
      </Head>

      <div>
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Employment & Labour (PLFS)
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-300">
            Key employment indicators from the Periodic Labour Force Survey.
            Population aged 15 years and above, usual status (PS+SS). Data from
            MoSPI.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Unemployment Rate ({latestYear})
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {latestUR.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Overall (PS+SS)</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              LFPR ({latestYear})
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {latestLFPR.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Labour Force Participation Rate
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              WPR ({latestYear})
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {latestWPR.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Worker Population Ratio
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Female LFPR ({latestYear})
            </p>
            <p className="text-2xl font-bold text-green-700 mt-1">
              {latestFemaleLFPR.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Up from {data.lfpr.female[0].toFixed(1)}% in {data.years[0]}
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-6">
          {/* Unemployment Rate by gender */}
          <LineChart
            series={urGenderSeries}
            title="Unemployment Rate by Gender"
            subtitle="Usual status (PS+SS), age 15+, All India"
            source={SOURCE_LABEL}
            sourceUrl={SOURCE_URL}
            yAxisTitle="Unemployment Rate (%)"
            height={420}
          />

          {/* Unemployment Rate rural vs urban */}
          <LineChart
            series={urSectorSeries}
            title="Unemployment Rate — Rural vs Urban"
            subtitle="Overall (persons), usual status (PS+SS), age 15+"
            source={SOURCE_LABEL}
            sourceUrl={SOURCE_URL}
            yAxisTitle="Unemployment Rate (%)"
            height={420}
          />

          {/* LFPR by gender */}
          <LineChart
            series={lfprGenderSeries}
            title="Labour Force Participation Rate by Gender"
            subtitle="Usual status (PS+SS), age 15+, All India"
            source={SOURCE_LABEL}
            sourceUrl={SOURCE_URL}
            yAxisTitle="LFPR (%)"
            height={420}
          />

          {/* WPR by gender */}
          <LineChart
            series={wprGenderSeries}
            title="Worker Population Ratio by Gender"
            subtitle="Usual status (PS+SS), age 15+, All India"
            source={SOURCE_LABEL}
            sourceUrl={SOURCE_URL}
            yAxisTitle="WPR (%)"
            height={420}
          />
        </div>

        {/* Data source info */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200">
            About this data
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            The Periodic Labour Force Survey (PLFS) is conducted by the Ministry
            of Statistics and Programme Implementation (MoSPI). It provides
            annual and quarterly estimates of key employment indicators. Data
            shown is for the usual status (principal + subsidiary status,
            PS+SS) for population aged 15 years and above across all India.
            LFPR = Labour Force Participation Rate; WPR = Worker Population
            Ratio; UR = Unemployment Rate.
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
