import Head from "next/head";
import {
  usePLFSAnnualData,
  usePLFSQuarterlyData,
  plfsGenderSeries,
  plfsUrSectorSeries,
  plfsQuarterlySeries,
  plfsLatestQuarter,
} from "@/lib/hooks/useMospiPLFS";
import LineChart from "@/components/charts/LineChart";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorDisplay from "@/components/ui/ErrorDisplay";

const SOURCE_LABEL = "MoSPI, Periodic Labour Force Survey";
const SOURCE_URL = "https://www.mospi.gov.in/publication/periodic-labour-force-survey-plfs-1";
const QUARTERLY_SOURCE_LABEL = "MoSPI, PLFS Quarterly Bulletin";
const QUARTERLY_SOURCE_URL = "https://www.mospi.gov.in/publication/quarterly-bulletin-periodic-labour-force-survey-plfs";

export default function EmploymentDashboard() {
  const annual = usePLFSAnnualData();
  const quarterly = usePLFSQuarterlyData();

  if (annual.isLoading || quarterly.isLoading) {
    return <LoadingSpinner message="Loading PLFS data..." />;
  }

  if (annual.error || !annual.data) {
    return (
      <ErrorDisplay
        message={
          annual.error instanceof Error
            ? annual.error.message
            : "Failed to load Periodic Labour Force Survey data"
        }
        onRetry={() => annual.refetch()}
      />
    );
  }

  const data = annual.data;
  const qData = quarterly.data;

  // ── Annual summary card values ─────────────────────────────────────────────
  const latestIdx = data.years.length - 1;
  const latestYear = data.years[latestIdx];
  const latestUR = data.ur.person[latestIdx];
  const latestLFPR = data.lfpr.person[latestIdx];
  const latestWPR = data.wpr.person[latestIdx];
  const latestFemaleLFPR = data.lfpr.female[latestIdx];

  // ── Annual chart series ────────────────────────────────────────────────────
  const urGenderSeries = plfsGenderSeries(data, "ur", ["male", "female", "person"]);
  const urSectorSeries = plfsUrSectorSeries(data);
  const lfprGenderSeries = plfsGenderSeries(data, "lfpr", ["male", "female", "person"]);
  const wprGenderSeries = plfsGenderSeries(data, "wpr", ["male", "female", "person"]);

  // ── Latest quarterly urban values (for summary cards) ─────────────────────
  const latestQ = qData ? plfsLatestQuarter(qData, "urban") : null;
  const latestQLabel = latestQ?.label ?? "–";
  const latestQUR = latestQ?.ur.urban.person ?? null;
  const latestQLFPR = latestQ?.lfpr.urban.person ?? null;

  // ── Quarterly chart series (urban) ────────────────────────────────────────
  const qUrSeries = qData
    ? plfsQuarterlySeries(qData, "ur", "urban", ["male", "female", "person"])
    : [];
  const qLfprSeries = qData
    ? plfsQuarterlySeries(qData, "lfpr", "urban", ["male", "female", "person"])
    : [];
  const qWprSeries = qData
    ? plfsQuarterlySeries(qData, "wpr", "urban", ["male", "female", "person"])
    : [];

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
              Urban UR — Latest Quarter
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {latestQUR != null ? `${latestQUR.toFixed(1)}%` : "–"}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Overall (PS+SS) · {latestQLabel}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Urban LFPR — Latest Quarter
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {latestQLFPR != null ? `${latestQLFPR.toFixed(1)}%` : "–"}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Labour Force Participation · {latestQLabel}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Unemployment Rate ({latestYear})
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {latestUR.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Annual All India</p>
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

        {/* ── Quarterly Urban Trends ───────────────────────────────────────── */}
        {qData ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Quarterly Urban Labour Market Trends
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Urban India only · PLFS Quarterly Bulletin · 2017-18 to present
              </p>
            </div>

            {/* Quarterly UR */}
            <LineChart
              series={qUrSeries}
              title="Urban Unemployment Rate — Quarterly"
              subtitle="Usual status (PS+SS), age 15+, Urban India"
              source={QUARTERLY_SOURCE_LABEL}
              sourceUrl={QUARTERLY_SOURCE_URL}
              yAxisTitle="Unemployment Rate (%)"
              height={420}
            />

            {/* Quarterly LFPR */}
            <LineChart
              series={qLfprSeries}
              title="Urban Labour Force Participation Rate — Quarterly"
              subtitle="Usual status (PS+SS), age 15+, Urban India"
              source={QUARTERLY_SOURCE_LABEL}
              sourceUrl={QUARTERLY_SOURCE_URL}
              yAxisTitle="LFPR (%)"
              height={420}
            />

            {/* Quarterly WPR */}
            <LineChart
              series={qWprSeries}
              title="Urban Worker Population Ratio — Quarterly"
              subtitle="Usual status (PS+SS), age 15+, Urban India"
              source={QUARTERLY_SOURCE_LABEL}
              sourceUrl={QUARTERLY_SOURCE_URL}
              yAxisTitle="WPR (%)"
              height={420}
            />

            {/* Data quality note */}
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-800">
              <h3 className="text-sm font-semibold text-orange-900 dark:text-orange-200">
                Data quality note
              </h3>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                The APR–JUN quarters for 2018-19 and 2019-20 show anomalously high
                unemployment rates (~20%) and an unusually low WPR in 2019-20 Q1 —
                these values come directly from the MoSPI API and are likely due to
                early quarterly bulletin data quality issues rather than actual
                economic conditions. The 2020-21 APR–JUN and JUL–SEP spikes
                reflect genuine COVID-19 lockdown impacts. One data point
                (2020-21 Q2 female LFPR) is absent due to a typographic error in
                the source API.
              </p>
            </div>
          </div>
        ) : quarterly.error ? (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Quarterly data unavailable — showing annual estimates only.
            </p>
          </div>
        ) : null}

        {/* ── Annual All-India Estimates ───────────────────────────────────── */}
        <div className="mt-8 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Annual Estimates — All India
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Includes rural + urban · Annual PLFS report · 2017-18 to {latestYear}
            </p>
          </div>

          {/* Unemployment Rate by gender */}
          <LineChart
            series={urGenderSeries}
            title="Unemployment Rate by Gender"
            subtitle="Usual status (PS+SS), age 15+, All India"
            source={SOURCE_LABEL}
            sourceUrl={SOURCE_URL}
            yAxisTitle="Unemployment Rate (%)"
            height={380}
          />

          {/* Unemployment Rate rural vs urban */}
          <LineChart
            series={urSectorSeries}
            title="Unemployment Rate — Rural vs Urban"
            subtitle="Overall (persons), usual status (PS+SS), age 15+, All India"
            source={SOURCE_LABEL}
            sourceUrl={SOURCE_URL}
            yAxisTitle="Unemployment Rate (%)"
            height={380}
          />

          {/* LFPR by gender */}
          <LineChart
            series={lfprGenderSeries}
            title="Labour Force Participation Rate by Gender"
            subtitle="Usual status (PS+SS), age 15+, All India"
            source={SOURCE_LABEL}
            sourceUrl={SOURCE_URL}
            yAxisTitle="LFPR (%)"
            height={380}
          />

          {/* WPR by gender */}
          <LineChart
            series={wprGenderSeries}
            title="Worker Population Ratio by Gender"
            subtitle="Usual status (PS+SS), age 15+, All India"
            source={SOURCE_LABEL}
            sourceUrl={SOURCE_URL}
            yAxisTitle="WPR (%)"
            height={380}
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
            annual and quarterly estimates of key employment indicators. Annual
            data covers all India (rural + urban) while the quarterly bulletin
            covers urban India only (rural + urban available from 2024-25 Q1
            onwards). All figures use usual status (principal + subsidiary
            status, PS+SS) for population aged 15 years and above.
            LFPR = Labour Force Participation Rate; WPR = Worker Population
            Ratio; UR = Unemployment Rate.
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
            Sources:{" "}
            <a
              href={SOURCE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-900 dark:hover:text-blue-100"
            >
              PLFS Annual Report
            </a>
            {" · "}
            <a
              href={QUARTERLY_SOURCE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-900 dark:hover:text-blue-100"
            >
              PLFS Quarterly Bulletin
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
