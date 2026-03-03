import Head from "next/head";
import { useCPIMonthlyData, cpiToSeries } from "@/lib/hooks/useMospiCPI";
import { useWPIMonthlyData, wpiToSeries } from "@/lib/hooks/useMospiWPI";
import LineChart from "@/components/charts/LineChart";
import HeatmapChart from "@/components/charts/HeatmapChart";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorDisplay from "@/components/ui/ErrorDisplay";
import type { CPIMonthDataPoint } from "@/lib/api/types";

const MOSPI_CPI_SOURCE = "MoSPI CPI, All India Combined";
const MOSPI_CPI_URL = "https://mospi.gov.in/web/mospi/inflation";
const MOSPI_WPI_SOURCE = "MoSPI WPI (base year 2011-12)";
const MOSPI_WPI_URL =
  "https://mospi.gov.in/web/mospi/reports-publications/-/reports/view/templateOne/16904?q=16904";

// ── Heatmap helpers ───────────────────────────────────────────────────────────

const MONTH_ORDER = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const MONTH_SHORT: Record<string, string> = {
  January: "Jan", February: "Feb", March: "Mar", April: "Apr",
  May: "May", June: "Jun", July: "Jul", August: "Aug",
  September: "Sep", October: "Oct", November: "Nov", December: "Dec",
};

type CPINumericField = Exclude<
  keyof CPIMonthDataPoint,
  "year" | "month" | "label"
>;

/**
 * Build a seasonal matrix for a single CPI field.
 * Rows = years (newest first so latest year appears at top of heatmap).
 * Cols = Jan … Dec.
 * Cells with no data are null.
 */
function buildSeasonalMatrix(
  months: CPIMonthDataPoint[],
  field: CPINumericField
): { z: (number | null)[][]; x: string[]; y: string[] } {
  const years = [...new Set(months.map((m) => m.year))].sort((a, b) => b - a); // newest first → top row
  const z = years.map((year) =>
    MONTH_ORDER.map((shortMon) => {
      const found = months.find(
        (m) => m.year === year && MONTH_SHORT[m.month] === shortMon
      );
      const val = found?.[field];
      return typeof val === "number" ? val : null;
    })
  );
  return { z, x: MONTH_ORDER, y: years.map(String) };
}

/**
 * Build a category-vs-year matrix.
 * Rows = category labels (newest-first on screen, so reversed display).
 * Cols = years (ascending, oldest → newest).
 * Cell value = mean of all monthly readings for that category in that year
 *              (null if no data available).
 */
function buildCategoryYearMatrix(
  months: CPIMonthDataPoint[],
  fields: { key: CPINumericField; label: string }[]
): { z: (number | null)[][]; x: string[]; y: string[] } {
  const years = [...new Set(months.map((m) => m.year))].sort(); // ascending
  const z = fields.map(({ key }) =>
    years.map((year) => {
      const readings = months
        .filter((m) => m.year === year)
        .map((m) => m[key])
        .filter((v): v is number => typeof v === "number");
      if (readings.length === 0) return null;
      return Math.round((readings.reduce((s, v) => s + v, 0) / readings.length) * 100) / 100;
    })
  );
  return {
    z,
    x: years.map(String),
    y: fields.map((f) => f.label),
  };
}

// ── Colour helpers ────────────────────────────────────────────────────────────

/** Returns a Tailwind colour class based on the inflation reading */
function inflationColor(value: number | null): string {
  if (value === null) return "text-gray-900 dark:text-white";
  if (value > 6) return "text-red-600 dark:text-red-400";
  if (value > 4) return "text-orange-600 dark:text-orange-400";
  if (value >= 0) return "text-green-700 dark:text-green-400";
  return "text-blue-600 dark:text-blue-400"; // deflation
}

// Heatmap colour scale is computed dynamically by HeatmapChart via divideAt={4.5}:
// deep blue at data-minimum → white/neutral at 4.5% (RBI mid-target) → deep red at +12.5%.
// No static colorscale constant needed here.

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function InflationDashboard() {
  const {
    data: cpiData,
    isLoading: cpiLoading,
    error: cpiError,
    refetch: refetchCPI,
  } = useCPIMonthlyData();

  const {
    data: wpiData,
    isLoading: wpiLoading,
    error: wpiError,
    refetch: refetchWPI,
  } = useWPIMonthlyData();

  if (cpiLoading || wpiLoading) {
    return <LoadingSpinner message="Loading inflation data..." />;
  }

  if ((cpiError && !cpiData) || (wpiError && !wpiData)) {
    return (
      <ErrorDisplay
        message="Failed to load inflation data."
        onRetry={() => {
          refetchCPI();
          refetchWPI();
        }}
      />
    );
  }

  // ── Latest-reading helpers ──────────────────────────────────────────────

  function latestCPI(field: "general" | "foodBeverages" | "fuelLight" | "vegetables") {
    if (!cpiData) return { value: null as number | null, label: "" };
    const found = [...cpiData.months].reverse().find((m) => m[field] !== null);
    return { value: found?.[field] ?? null, label: found?.label ?? "" };
  }

  function latestWPI(field: "headline" | "foodIndex" | "fuelPower") {
    if (!wpiData) return { value: null as number | null, label: "" };
    const found = [...wpiData.monthly].reverse().find((m) => m[field] !== null);
    return { value: found?.[field] ?? null, label: found?.label ?? "" };
  }

  const latestHeadlineCPI = latestCPI("general");
  const latestFoodCPI = latestCPI("foodBeverages");
  const latestVegCPI = latestCPI("vegetables");
  const latestHeadlineWPI = latestWPI("headline");

  // ── Line chart series ───────────────────────────────────────────────────

  const cpiHeadlineSeries = cpiData ? cpiToSeries(cpiData, ["general"]) : [];

  const cpiComponentSeries = cpiData
    ? cpiToSeries(
        cpiData,
        ["general", "foodBeverages", "fuelLight", "housing", "clothingFootwear", "miscellaneous"],
        2020
      )
    : [];

  const cpiFoodSeries = cpiData
    ? cpiToSeries(
        cpiData,
        ["vegetables", "fruits", "cereals", "pulses", "oilsFats", "milkProducts", "meatFish", "spices"],
        2021
      )
    : [];

  const wpiSeries = wpiData
    ? wpiToSeries(wpiData, ["headline", "primaryArticles", "fuelPower", "foodIndex"])
    : [];

  // ── Heatmap matrices ────────────────────────────────────────────────────

  // Heatmap 1: General CPI seasonal calendar (year × month)
  const generalHeatmap = cpiData
    ? buildSeasonalMatrix(cpiData.months, "general")
    : null;

  // Heatmap 2: Food sub-groups annual average (category × year)
  const foodFields: { key: CPINumericField; label: string }[] = [
    { key: "vegetables",    label: "Vegetables" },
    { key: "fruits",        label: "Fruits" },
    { key: "oilsFats",      label: "Oils & Fats" },
    { key: "pulses",        label: "Pulses" },
    { key: "meatFish",      label: "Meat & Fish" },
    { key: "cereals",       label: "Cereals" },
    { key: "spices",        label: "Spices" },
    { key: "milkProducts",  label: "Milk Products" },
  ];

  const foodHeatmap = cpiData
    ? buildCategoryYearMatrix(cpiData.months, foodFields)
    : null;

  return (
    <>
      <Head>
        <title>Inflation (CPI & WPI) | India Data Dashboard</title>
        <meta
          name="description"
          content="India CPI and WPI inflation trends — headline, food, fuel, and sub-group breakdowns. Source: MoSPI."
        />
      </Head>

      <div>
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Inflation (CPI & WPI)
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-300">
            Consumer and Wholesale Price Index trends for India — headline, food, fuel, and
            sub-group breakdowns. All figures show YoY % change. Source: MoSPI.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              CPI Headline{latestHeadlineCPI.label ? ` (${latestHeadlineCPI.label})` : ""}
            </p>
            <p className={`text-2xl font-bold mt-1 ${inflationColor(latestHeadlineCPI.value)}`}>
              {latestHeadlineCPI.value != null
                ? `${latestHeadlineCPI.value.toFixed(2)}%`
                : "—"}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              All India Combined, base year 2012
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              CPI Food{latestFoodCPI.label ? ` (${latestFoodCPI.label})` : ""}
            </p>
            <p className={`text-2xl font-bold mt-1 ${inflationColor(latestFoodCPI.value)}`}>
              {latestFoodCPI.value != null
                ? `${latestFoodCPI.value.toFixed(2)}%`
                : "—"}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Food &amp; Beverages sub-index
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Vegetables{latestVegCPI.label ? ` (${latestVegCPI.label})` : ""}
            </p>
            <p className={`text-2xl font-bold mt-1 ${inflationColor(latestVegCPI.value)}`}>
              {latestVegCPI.value != null
                ? `${latestVegCPI.value.toFixed(2)}%`
                : "—"}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Most volatile food category
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              WPI Headline{latestHeadlineWPI.label ? ` (${latestHeadlineWPI.label})` : ""}
            </p>
            <p className={`text-2xl font-bold mt-1 ${inflationColor(latestHeadlineWPI.value)}`}>
              {latestHeadlineWPI.value != null
                ? `${latestHeadlineWPI.value.toFixed(2)}%`
                : "—"}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Wholesale prices, base year 2011-12
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-6">

          {/* 1 — CPI Headline trend */}
          {cpiHeadlineSeries.length > 0 && (
            <LineChart
              series={cpiHeadlineSeries}
              showMarkers={false}
              title="CPI Headline Inflation (Monthly)"
              subtitle="All India Combined — Year-on-Year % change, base year 2012=100"
              source={MOSPI_CPI_SOURCE}
              sourceUrl={MOSPI_CPI_URL}
              yAxisTitle="YoY % Change"
              height={380}
            />
          )}

          {/* 2 — Seasonal calendar heatmap (General CPI, year × month) */}
          {generalHeatmap && (
            <HeatmapChart
              z={generalHeatmap.z}
              x={generalHeatmap.x}
              y={generalHeatmap.y}
              divideAt={4.5}
              zmax={12.5}
              valueUnit="%"
              valuePrecision={1}
              showAnnotations={true}
              title="CPI Inflation Calendar (Seasonal Heatmap)"
              subtitle="Each cell = YoY % for that month. Newest year at top. Blue = below 4.5% · White = 4.5% · Red = +12.5%"
              source={MOSPI_CPI_SOURCE}
              sourceUrl={MOSPI_CPI_URL}
              height={460}
            />
          )}

          {/* 3 — CPI major components (since 2020) */}
          {cpiComponentSeries.length > 0 && (
            <LineChart
              series={cpiComponentSeries}
              showMarkers={false}
              title="CPI by Major Component (2020 onwards)"
              subtitle="Food & Beverages, Fuel & Light, Housing, Clothing, Miscellaneous — YoY %"
              source={MOSPI_CPI_SOURCE}
              sourceUrl={MOSPI_CPI_URL}
              yAxisTitle="YoY % Change"
              height={420}
            />
          )}

          {/* 4 — CPI food sub-groups (since 2021) */}
          {cpiFoodSeries.length > 0 && (
            <LineChart
              series={cpiFoodSeries}
              showMarkers={false}
              title="CPI Food Sub-Groups (2021 onwards)"
              subtitle="Vegetables, Fruits, Cereals, Pulses, Oils, Milk, Meat, Spices — YoY %"
              source={MOSPI_CPI_SOURCE}
              sourceUrl={MOSPI_CPI_URL}
              yAxisTitle="YoY % Change"
              height={420}
            />
          )}

          {/* 5 — Food sub-group annual heatmap (category × year) */}
          {foodHeatmap && (
            <HeatmapChart
              z={foodHeatmap.z}
              x={foodHeatmap.x}
              y={foodHeatmap.y}
              divideAt={4.5}
              zmax={12.5}
              valueUnit="%"
              valuePrecision={1}
              showAnnotations={true}
              title="Food Sub-groups — Annual Average Inflation"
              subtitle="Each cell = annual average YoY % for that food category. Blue = below 4.5% · White = 4.5% · Red = high inflation (capped at +12.5%)"
              source={MOSPI_CPI_SOURCE}
              sourceUrl={MOSPI_CPI_URL}
              height={320}
            />
          )}

          {/* 6 — WPI components */}
          {wpiSeries.length > 0 && (
            <LineChart
              series={wpiSeries}
              showMarkers={false}
              title="WPI by Component (Monthly)"
              subtitle="Headline WPI, Primary Articles, Fuel & Power, Food Index — YoY % change"
              source={MOSPI_WPI_SOURCE}
              sourceUrl={MOSPI_WPI_URL}
              yAxisTitle="YoY % Change"
              height={380}
            />
          )}
        </div>

        {/* About this data */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200">
            About this data
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            <strong>CPI</strong> data covers All India Combined for 14 sub-groups (base year
            2012=100), sourced from the{" "}
            <a
              href={MOSPI_CPI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-900 dark:hover:text-blue-100"
            >
              MoSPI CPI portal
            </a>
            . Inflation figures are YoY % change pre-computed by MoSPI. Coverage: February 2014 –
            December 2025. Heatmap colours: deep blue at the data minimum, white/neutral at 4.5%
            (midpoint of RBI&apos;s 2–6% tolerance band), deep red at +12.5%.{" "}
            <strong>WPI</strong> data (base year 2011-12=100) covers Headline, Primary Articles,
            Fuel &amp; Power, and Food Index from the{" "}
            <a
              href={MOSPI_WPI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-900 dark:hover:text-blue-100"
            >
              MoSPI WPI release
            </a>
            . Coverage: April 2013 – January 2026. Manufactured Products WPI coverage is limited
            to 2024-25 onwards.
          </p>
        </div>
      </div>
    </>
  );
}
