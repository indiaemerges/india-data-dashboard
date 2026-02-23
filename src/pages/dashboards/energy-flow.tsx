import { useState } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useSankeyData } from "@/lib/hooks/useMospiEnergy";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorDisplay from "@/components/ui/ErrorDisplay";
import type { EnergyUnit, EnergyYear } from "@/lib/api/types";
import { ENERGY_YEARS } from "@/lib/api/types";

// Dynamic import SankeyDiagram (uses Plotly which requires window)
const SankeyDiagram = dynamic(
  () => import("@/components/charts/SankeyDiagram"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading Sankey diagram...</p>
        </div>
      </div>
    ),
  }
);

/** Format a number with Indian locale grouping */
function fmtNum(value: number, decimals = 0): string {
  return value.toLocaleString("en-IN", { maximumFractionDigits: decimals });
}

export default function EnergyFlowDashboard() {
  const [year, setYear] = useState<EnergyYear>("2023-24");
  const [unit, setUnit] = useState<EnergyUnit>("KToE");

  const { data: sankeyData, isLoading, error, refetch } = useSankeyData(year, unit);

  // Compute derived metrics
  const consumptionRatio = sankeyData
    ? ((sankeyData.totalConsumption / sankeyData.totalSupply) * 100).toFixed(1)
    : null;

  return (
    <>
      <Head>
        <title>Energy Balance & Flows | India Data Dashboard</title>
        <meta
          name="description"
          content="India's energy balance as interactive Sankey diagrams. Production, imports, transformation, and end-use across all fuels."
        />
      </Head>

      <div>
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Energy Balance & Flows
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-300">
            India&apos;s energy balance showing the flow from primary sources
            through transformation to final consumption sectors. Data from MoSPI
            Energy Statistics.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {/* Year selector */}
          <div>
            <label
              htmlFor="year-select"
              className="block text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1"
            >
              Fiscal Year
            </label>
            <select
              id="year-select"
              value={year}
              onChange={(e) => setYear(e.target.value as EnergyYear)}
              className="block w-40 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            >
              {ENERGY_YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Unit toggle */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Unit
            </label>
            <div className="flex rounded-md border border-gray-300 dark:border-gray-600 overflow-hidden">
              <button
                onClick={() => setUnit("KToE")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  unit === "KToE"
                    ? "bg-orange-500 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                KToE
              </button>
              <button
                onClick={() => setUnit("PetaJoules")}
                className={`px-4 py-2 text-sm font-medium border-l border-gray-300 dark:border-gray-600 transition-colors ${
                  unit === "PetaJoules"
                    ? "bg-orange-500 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                PetaJoules
              </button>
            </div>
          </div>
        </div>

        {/* Summary cards */}
        {sankeyData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Total Primary Supply
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {fmtNum(sankeyData.totalSupply)}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {sankeyData.unit} ({sankeyData.year})
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Final Consumption
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {fmtNum(sankeyData.totalConsumption)}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {sankeyData.unit} ({sankeyData.year})
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Consumption / Supply
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {consumptionRatio}%
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Final use as % of primary supply
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Active Flows
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {sankeyData.links.length}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Energy pathways in {sankeyData.year}
              </p>
            </div>
          </div>
        )}

        {/* Main Sankey Diagram */}
        {isLoading && (
          <LoadingSpinner message={`Loading energy data for ${year}...`} />
        )}

        {error && !isLoading && (
          <ErrorDisplay
            title="Energy data unavailable"
            message={
              error instanceof Error
                ? error.message
                : `Failed to load energy balance data for ${year} (${unit}).`
            }
            onRetry={() => refetch()}
          />
        )}

        {sankeyData && !isLoading && (
          <SankeyDiagram
            data={sankeyData}
            title={`India Energy Balance \u2014 ${sankeyData.year}`}
            subtitle={`Energy flows from primary sources to end-use sectors (${sankeyData.unit})`}
            source="MoSPI Energy Statistics, eSankhyiki"
            sourceUrl="https://www.mospi.gov.in/publication/energy-statistics-india"
            height={720}
          />
        )}

        {/* Reading guide */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              How to read this diagram
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-300 mt-2 space-y-1 list-disc list-inside">
              <li>
                <strong>Left:</strong> Energy enters via domestic production and imports
              </li>
              <li>
                <strong>Middle-left:</strong> Primary fuels (coal, oil, gas, renewables)
              </li>
              <li>
                <strong>Middle-right:</strong> Transformation (refining, power generation)
              </li>
              <li>
                <strong>Right:</strong> Final consumption by industry, transport, and others
              </li>
              <li>Hover over flows to see values and share of total supply</li>
            </ul>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200">
              About this data
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Energy balance data is sourced from MoSPI via the eSankhyiki API.
              Supply data is verified from the API for all 12 years. KToE =
              Kilotonnes of Oil Equivalent; 1 KToE = 0.04187 PetaJoules.
              Data covers fiscal years 2012-13 through 2023-24.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
