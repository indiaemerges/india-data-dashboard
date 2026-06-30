import Head from "next/head";
import { useMemo } from "react";
import StateMapPanel from "@/components/charts/StateMapPanel";
import BarChart from "@/components/charts/BarChart";
import { useMPIStateData } from "@/lib/hooks/useMospiState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorDisplay from "@/components/ui/ErrorDisplay";
import type { DataSeries } from "@/lib/api/types";

const SOURCE = "NITI Aayog National MPI";
const SOURCE_URL = "https://www.niti.gov.in/";

const INDICATOR_LABELS: Record<string, string> = {
  nutrition: "Nutrition",
  childMortality: "Child & Adolescent Mortality",
  maternalHealth: "Maternal Health",
  yearsSchooling: "Years of Schooling",
  schoolAttendance: "School Attendance",
  cookingFuel: "Cooking Fuel",
  sanitation: "Sanitation",
  electricity: "Electricity",
  housing: "Housing",
  assets: "Assets",
  bankAccount: "Bank Account",
};

export default function PovertyMPIDashboard() {
  const { data, isLoading, error, refetch } = useMPIStateData();

  const ranking = useMemo(() => {
    if (!data) return [];
    return [...data.states]
      .filter((s) => s.stateName !== "India")
      .sort((a, b) => b.mpi.total[1] - a.mpi.total[1]);
  }, [data]);

  const mpiRankSeries: DataSeries[] = useMemo(() => {
    if (ranking.length === 0) return [];
    return [
      {
        source: "niti",
        indicator: "MPI Score (2019-21)",
        unit: "",
        frequency: "annual",
        color: "#ea580c",
        data: ranking.map((s) => ({ date: s.stateName, value: s.mpi.total[1] })),
        metadata: { lastUpdated: data!.lastUpdated, sourceUrl: SOURCE_URL },
      },
    ];
  }, [ranking, data]);

  const headcountChangeSeries: DataSeries[] = useMemo(() => {
    if (ranking.length === 0) return [];
    const sorted = [...ranking].sort(
      (a, b) =>
        a.headcountRatio.total[1] - a.headcountRatio.total[0] -
        (b.headcountRatio.total[1] - b.headcountRatio.total[0])
    );
    return [
      {
        source: "niti",
        indicator: "Change in Headcount Ratio (2015-16 → 2019-21, pp)",
        unit: "pp",
        frequency: "annual",
        color: "#0d9488",
        data: sorted.map((s) => ({
          date: s.stateName,
          value: Number((s.headcountRatio.total[1] - s.headcountRatio.total[0]).toFixed(2)),
        })),
        metadata: { lastUpdated: data!.lastUpdated, sourceUrl: SOURCE_URL },
      },
    ];
  }, [ranking, data]);

  const nationalIndicatorSeries: DataSeries[] = useMemo(() => {
    if (!data) return [];
    const india = data.states.find((s) => s.stateName === "India");
    if (!india?.uncensoredHR) return [];
    const entries = Object.entries(india.uncensoredHR).sort((a, b) => b[1][1] - a[1][1]);
    return [
      {
        source: "niti",
        indicator: "% deprived, 2019-21",
        unit: "%",
        frequency: "annual",
        color: "#7c3aed",
        data: entries.map(([k, v]) => ({ date: INDICATOR_LABELS[k] ?? k, value: v[1] })),
        metadata: { lastUpdated: data.lastUpdated, sourceUrl: SOURCE_URL },
      },
    ];
  }, [data]);

  if (isLoading) return <LoadingSpinner message="Loading MPI data..." />;
  if (error || !data) {
    return (
      <ErrorDisplay
        message={error instanceof Error ? error.message : "Failed to load MPI data"}
        onRetry={() => refetch()}
      />
    );
  }

  const india = data.states.find((s) => s.stateName === "India")!;
  const poorest = ranking[0];
  const mostImproved = [...ranking].sort(
    (a, b) =>
      a.mpi.total[1] - a.mpi.total[0] - (b.mpi.total[1] - b.mpi.total[0])
  )[0];

  return (
    <>
      <Head>
        <title>Multidimensional Poverty (MPI) | India Data Dashboard</title>
        <meta
          name="description"
          content="State-wise Multidimensional Poverty Index (MPI), Headcount Ratio, and Intensity for India — NITI Aayog National MPI, comparing NFHS-4 (2015-16) and NFHS-5 (2019-21)."
        />
      </Head>

      <div>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Multidimensional Poverty (MPI)
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-300">
            State/UT-wise Multidimensional Poverty Index, Headcount Ratio, and Intensity,
            comparing NFHS-4 (2015-16) and NFHS-5 (2019-21). Source: {SOURCE}.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              India MPI (2019-21)
            </p>
            <p className="text-2xl font-bold text-orange-600 mt-1">
              {india.mpi.total[1].toFixed(3)}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Down from {india.mpi.total[0].toFixed(3)} in 2015-16
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Headcount Ratio (H)
            </p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {india.headcountRatio.total[1].toFixed(2)}%
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              of population multidimensionally poor, down from {india.headcountRatio.total[0].toFixed(2)}%
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Highest MPI (2019-21)
            </p>
            <p className="text-2xl font-bold text-red-700 mt-1">
              {poorest.stateName}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              MPI {poorest.mpi.total[1].toFixed(3)} · H {poorest.headcountRatio.total[1].toFixed(1)}%
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Most Improved (MPI Δ)
            </p>
            <p className="text-2xl font-bold text-green-700 mt-1">
              {mostImproved.stateName}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              MPI {mostImproved.mpi.total[0].toFixed(3)} → {mostImproved.mpi.total[1].toFixed(3)}
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-6">
          <BarChart
            series={mpiRankSeries}
            title="State/UT Ranking by MPI Score (2019-21)"
            subtitle="Multidimensional Poverty Index = Headcount Ratio × Intensity — higher means more widespread and intense poverty"
            source={SOURCE}
            sourceUrl={SOURCE_URL}
            yAxisTitle="MPI Score"
            orientation="h"
            height={900}
          />

          <BarChart
            series={headcountChangeSeries}
            title="Change in Poverty Headcount Ratio, 2015-16 → 2019-21"
            subtitle="Percentage-point change in the share of population that is multidimensionally poor — negative means poverty fell"
            source={SOURCE}
            sourceUrl={SOURCE_URL}
            yAxisTitle="Percentage points"
            orientation="h"
            height={900}
          />

          <BarChart
            series={nationalIndicatorSeries}
            title="National Deprivation Rate by Indicator (2019-21)"
            subtitle="% of India's population deprived in each MPI indicator — uncensored (among all, not just the poor)"
            source={SOURCE}
            sourceUrl={SOURCE_URL}
            yAxisTitle="% deprived"
            orientation="h"
            height={420}
          />
        </div>

        {/* State-level maps */}
        <div className="mt-8">
          <StateMapPanel indicators={["mpi_score", "mpi_headcount", "mpi_intensity"]} />
        </div>
      </div>
    </>
  );
}
