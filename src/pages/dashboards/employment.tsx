import { useState } from "react";
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
const SOURCE_URL =
  "https://www.mospi.gov.in/publication/periodic-labour-force-survey-plfs-1";
const QUARTERLY_SOURCE_LABEL = "MoSPI, PLFS Quarterly Bulletin";
const QUARTERLY_SOURCE_URL =
  "https://www.mospi.gov.in/publication/quarterly-bulletin-periodic-labour-force-survey-plfs";

type ViewMode = "quarterly" | "annual";

export default function EmploymentDashboard() {
  const [view, setView] = useState<ViewMode>("quarterly");

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

  // ── Annual values ──────────────────────────────────────────────────────────
  const latestIdx = data.years.length - 1;
  const latestYear = data.years[latestIdx];

  // ── Latest quarterly urban values ─────────────────────────────────────────
  const latestQ = qData ? plfsLatestQuarter(qData, "urban") : null;
  const latestQLabel = latestQ?.label ?? "–";

  // ── Summary card values (switch with toggle) ───────────────────────────────
  const cards =
    view === "quarterly" && latestQ
      ? [
          {
            label: `Urban UR · ${latestQLabel}`,
            value: latestQ.ur.urban.person,
            sub: "Overall (PS+SS)",
          },
          {
            label: `Urban LFPR · ${latestQLabel}`,
            value: latestQ.lfpr.urban.person,
            sub: "Labour Force Participation Rate",
          },
          {
            label: `Urban WPR · ${latestQLabel}`,
            value: latestQ.wpr.urban.person,
            sub: "Worker Population Ratio",
          },
          {
            label: `Urban Female LFPR · ${latestQLabel}`,
            value: latestQ.lfpr.urban.female,
            sub: "Female labour force participation",
            highlight: true,
          },
        ]
      : [
          {
            label: `Unemployment Rate · ${latestYear}`,
            value: data.ur.person[latestIdx],
            sub: "All India (PS+SS)",
          },
          {
            label: `LFPR · ${latestYear}`,
            value: data.lfpr.person[latestIdx],
            sub: "Labour Force Participation Rate",
          },
          {
            label: `WPR · ${latestYear}`,
            value: data.wpr.person[latestIdx],
            sub: "Worker Population Ratio",
          },
          {
            label: `Female LFPR · ${latestYear}`,
            value: data.lfpr.female[latestIdx],
            sub: `Up from ${data.lfpr.female[0].toFixed(1)}% in ${data.years[0]}`,
            highlight: true,
          },
        ];

  // ── Chart series ───────────────────────────────────────────────────────────
  const qUrSeries = qData
    ? plfsQuarterlySeries(qData, "ur", "urban", ["male", "female", "person"])
    : [];
  const qLfprSeries = qData
    ? plfsQuarterlySeries(qData, "lfpr", "urban", ["male", "female", "person"])
    : [];
  const qWprSeries = qData
    ? plfsQuarterlySeries(qData, "wpr", "urban", ["male", "female", "person"])
    : [];

  const aUrGenderSeries = plfsGenderSeries(data, "ur", ["male", "female", "person"]);
  const aUrSectorSeries = plfsUrSectorSeries(data);
  const aLfprSeries = plfsGenderSeries(data, "lfpr", ["male", "female", "person"]);
  const aWprSeries = plfsGenderSeries(data, "wpr", ["male", "female", "person"]);

  // ── Toggle button styles ───────────────────────────────────────────────────
  const btnBase =
    "px-4 py-2 text-sm font-medium transition-colors focus:outline-none";
  const btnActive =
    "bg-orange-600 text-white";
  const btnInactive =
    "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700";

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
          {cards.map((card) => (
            <div
              key={card.label}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
            >
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {card.label}
              </p>
              <p
                className={`text-2xl font-bold mt-1 ${
                  card.highlight
                    ? "text-green-700"
                    : "text-gray-900 dark:text-white"
                }`}
              >
                {card.value != null ? `${card.value.toFixed(1)}%` : "–"}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {card.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Period toggle */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {view === "quarterly"
              ? `Urban India · PLFS Quarterly Bulletin · 2017-18 to ${latestQ?.year ?? "present"}`
              : `All India · Annual PLFS Report · ${data.years[0]} to ${latestYear}`}
          </p>
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => setView("quarterly")}
              className={`${btnBase} ${view === "quarterly" ? btnActive : btnInactive}`}
              aria-pressed={view === "quarterly"}
            >
              Quarterly · Urban
            </button>
            <button
              onClick={() => setView("annual")}
              className={`${btnBase} border-l border-gray-200 dark:border-gray-700 ${
                view === "annual" ? btnActive : btnInactive
              }`}
              aria-pressed={view === "annual"}
            >
              Annual · All India
            </button>
          </div>
        </div>

        {/* Charts — conditional on toggle */}
        {view === "quarterly" ? (
          <div className="space-y-6">
            {qData ? (
              <>
                <LineChart
                  series={qUrSeries}
                  title="Unemployment Rate — Quarterly"
                  subtitle="Usual status (PS+SS), age 15+, Urban India"
                  source={QUARTERLY_SOURCE_LABEL}
                  sourceUrl={QUARTERLY_SOURCE_URL}
                  yAxisTitle="Unemployment Rate (%)"
                  height={420}
                />
                <LineChart
                  series={qLfprSeries}
                  title="Labour Force Participation Rate — Quarterly"
                  subtitle="Usual status (PS+SS), age 15+, Urban India"
                  source={QUARTERLY_SOURCE_LABEL}
                  sourceUrl={QUARTERLY_SOURCE_URL}
                  yAxisTitle="LFPR (%)"
                  height={420}
                />
                <LineChart
                  series={qWprSeries}
                  title="Worker Population Ratio — Quarterly"
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
                    The APR–JUN quarters for 2018-19 and 2019-20 show anomalously
                    high unemployment rates (~20%) and an unusually low WPR —
                    these values come directly from the MoSPI API and likely reflect
                    early quarterly bulletin data quality issues, not actual economic
                    conditions. The 2020-21 APR–JUN and JUL–SEP spikes reflect
                    genuine COVID-19 lockdown impacts. One data point (2020-21 Q2
                    female LFPR) is absent due to a typographic error in the source
                    API.
                  </p>
                </div>
              </>
            ) : (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Quarterly data unavailable.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <LineChart
              series={aUrGenderSeries}
              title="Unemployment Rate by Gender"
              subtitle="Usual status (PS+SS), age 15+, All India"
              source={SOURCE_LABEL}
              sourceUrl={SOURCE_URL}
              yAxisTitle="Unemployment Rate (%)"
              height={420}
            />
            <LineChart
              series={aUrSectorSeries}
              title="Unemployment Rate — Rural vs Urban"
              subtitle="Overall (persons), usual status (PS+SS), age 15+, All India"
              source={SOURCE_LABEL}
              sourceUrl={SOURCE_URL}
              yAxisTitle="Unemployment Rate (%)"
              height={420}
            />
            <LineChart
              series={aLfprSeries}
              title="Labour Force Participation Rate by Gender"
              subtitle="Usual status (PS+SS), age 15+, All India"
              source={SOURCE_LABEL}
              sourceUrl={SOURCE_URL}
              yAxisTitle="LFPR (%)"
              height={420}
            />
            <LineChart
              series={aWprSeries}
              title="Worker Population Ratio by Gender"
              subtitle="Usual status (PS+SS), age 15+, All India"
              source={SOURCE_LABEL}
              sourceUrl={SOURCE_URL}
              yAxisTitle="WPR (%)"
              height={420}
            />
          </div>
        )}

        {/* About this data */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200">
            About this data
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            The Periodic Labour Force Survey (PLFS) is conducted by MoSPI.
            Quarterly data covers urban India only (rural + urban available from
            2024-25 Q1 onwards); annual data covers all India. All figures use
            usual status (PS+SS) for population aged 15+.
            LFPR = Labour Force Participation Rate · WPR = Worker Population
            Ratio · UR = Unemployment Rate.
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
