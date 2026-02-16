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
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading Sankey diagram...</p>
        </div>
      </div>
    ),
  }
);

export default function EnergyFlowDashboard() {
  const [year, setYear] = useState<EnergyYear>("2023-24");
  const [unit, setUnit] = useState<EnergyUnit>("KToE");

  const { data: sankeyData, isLoading, error, refetch } = useSankeyData(year, unit);

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
          <h1 className="text-2xl font-bold text-gray-900">
            Energy Balance & Flows
          </h1>
          <p className="mt-1 text-gray-600">
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
              className="block text-xs text-gray-500 uppercase tracking-wider mb-1"
            >
              Fiscal Year
            </label>
            <select
              id="year-select"
              value={year}
              onChange={(e) => setYear(e.target.value as EnergyYear)}
              className="block w-40 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
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
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">
              Unit
            </label>
            <div className="flex rounded-md border border-gray-300 overflow-hidden">
              <button
                onClick={() => setUnit("KToE")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  unit === "KToE"
                    ? "bg-orange-500 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                KToE
              </button>
              <button
                onClick={() => setUnit("PetaJoules")}
                className={`px-4 py-2 text-sm font-medium border-l border-gray-300 transition-colors ${
                  unit === "PetaJoules"
                    ? "bg-orange-500 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                PetaJoules
              </button>
            </div>
          </div>
        </div>

        {/* Summary cards */}
        {sankeyData && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Total Primary Supply
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {sankeyData.totalSupply.toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                })}
              </p>
              <p className="text-xs text-gray-400 mt-1">{sankeyData.unit}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Final Consumption
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {sankeyData.totalConsumption.toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                })}
              </p>
              <p className="text-xs text-gray-400 mt-1">{sankeyData.unit}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Active Flows
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {sankeyData.links.length}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Energy pathways in {sankeyData.year}
              </p>
            </div>
          </div>
        )}

        {/* Main Sankey Diagram */}
        {isLoading && (
          <LoadingSpinner message={`Fetching energy data for ${year}...`} />
        )}

        {error && !isLoading && (
          <ErrorDisplay
            message={
              error instanceof Error
                ? error.message
                : "Failed to fetch energy balance data"
            }
            onRetry={() => refetch()}
          />
        )}

        {sankeyData && !isLoading && (
          <SankeyDiagram
            data={sankeyData}
            title={`India Energy Balance — ${sankeyData.year}`}
            subtitle={`Energy flows from primary sources to end-use sectors (${sankeyData.unit})`}
            source="MoSPI Energy Statistics, eSankhyiki"
            sourceUrl="https://www.mospi.gov.in/publication/energy-statistics-india"
            height={700}
          />
        )}

        {/* Data source info */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="text-sm font-semibold text-blue-900">
            About this data
          </h3>
          <p className="text-sm text-blue-700 mt-1">
            Energy balance data is sourced from the Ministry of Statistics and
            Programme Implementation (MoSPI) via the eSankhyiki API. The diagram
            shows how primary energy from domestic production and imports flows
            through transformation (refining, power generation) to final
            consumption by industry, transport, and other sectors. KToE =
            Kilotonnes of Oil Equivalent.
          </p>
          <p className="text-sm text-blue-700 mt-2">
            <strong>Note:</strong> For 2023-24, the diagram uses pre-fetched
            data for instant loading. Other years fetch live from the MoSPI API
            and may take a moment to load. If the API is unavailable, only
            2023-24 data will be accessible.
          </p>
        </div>
      </div>
    </>
  );
}
