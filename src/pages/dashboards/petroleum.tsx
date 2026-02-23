import Head from "next/head";
import {
  usePetroleumData,
  petroleumSupplySeries,
  petroleumTradeSeries,
  petroleumConsumptionSeries,
} from "@/lib/hooks/useMospiPetroleum";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorDisplay from "@/components/ui/ErrorDisplay";

const SOURCE = "MoSPI, Energy Statistics India";
const SOURCE_URL = "https://mospi.gov.in/";

export default function PetroleumDashboard() {
  const { data, isLoading, error, refetch } = usePetroleumData();

  if (isLoading) return <LoadingSpinner message="Loading petroleum data..." />;
  if (error || !data) {
    return (
      <ErrorDisplay
        message={
          error instanceof Error
            ? error.message
            : "Failed to load petroleum data"
        }
        onRetry={() => refetch()}
      />
    );
  }

  // Latest year summary values
  const latestIdx = data.years.length - 1;
  const latestYear = data.years[latestIdx];
  const latestCrudeImports = data.supply.crudeOilImports[latestIdx];
  const latestCrudeProd = data.supply.crudeOilProduction[latestIdx];
  const latestRefinery = data.supply.refineryThroughput[latestIdx];
  const latestExports = data.supply.oilProductExports[latestIdx];

  // Import dependency ratio: imports / (production + imports)
  const importDepPct =
    latestCrudeImports > 0
      ? (latestCrudeImports / (latestCrudeImports + latestCrudeProd)) * 100
      : null;

  // Total oil product consumption in latest year
  const cons = data.consumption;
  const totalConsLatest =
    cons.diesel[latestIdx] +
    cons.petrol[latestIdx] +
    cons.lpg[latestIdx] +
    cons.naphtha[latestIdx] +
    cons.petCoke[latestIdx] +
    cons.atf[latestIdx] +
    cons.fuelOil[latestIdx] +
    cons.kerosene[latestIdx] +
    cons.bitumen[latestIdx] +
    cons.lubricants[latestIdx] +
    cons.others[latestIdx];

  // Chart series
  const supplySeries = petroleumSupplySeries(data);
  const tradeSeries = petroleumTradeSeries(data);
  const consumptionSeries = petroleumConsumptionSeries(data);

  // Split supply into crude supply (production + imports) vs refinery
  const crudeSupplySeries = supplySeries.filter(
    (s) =>
      s.indicatorId === "PETRO_CRUDE_PROD" ||
      s.indicatorId === "PETRO_CRUDE_IMP"
  );
  const refinerySeries = supplySeries.filter(
    (s) => s.indicatorId === "PETRO_REFINERY"
  );

  // Key fuels for transport/household chart
  const keyConsumptionSeries = consumptionSeries.filter((s) =>
    ["PETRO_CONS_DIESEL", "PETRO_CONS_PETROL", "PETRO_CONS_LPG", "PETRO_CONS_ATF"].includes(
      s.indicatorId ?? ""
    )
  );

  // Industrial / other products chart
  const industrialConsumptionSeries = consumptionSeries.filter((s) =>
    ["PETRO_CONS_NAPHTHA", "PETRO_CONS_PETCOKE", "PETRO_CONS_FUOIL", "PETRO_CONS_KERO"].includes(
      s.indicatorId ?? ""
    )
  );

  return (
    <>
      <Head>
        <title>Petroleum & Refining | India Data Dashboard</title>
        <meta
          name="description"
          content="India petroleum data — crude oil production, imports, refinery throughput, oil product exports, and final consumption by product type."
        />
      </Head>

      <div>
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Petroleum & Refining</h1>
          <p className="mt-1 text-gray-600">
            Crude oil production, imports, refinery throughput, oil product
            trade, and consumption by product type. Data from MoSPI Energy
            Statistics (2012-13 to {latestYear}), in Thousand Tonnes of Oil
            Equivalent (KToE).
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">
              Crude Oil Imports ({latestYear})
            </p>
            <p className="text-2xl font-bold text-red-700 mt-1">
              {latestCrudeImports != null
                ? `${(latestCrudeImports / 1000).toFixed(0)}mn t`
                : "—"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Thousand Tonnes (÷1000 shown in million)
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">
              Import Dependency ({latestYear})
            </p>
            <p className="text-2xl font-bold text-orange-700 mt-1">
              {importDepPct != null ? `${importDepPct.toFixed(1)}%` : "—"}
            </p>
            <p className="text-xs text-gray-400 mt-1">Share of crude met by imports</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">
              Refinery Throughput ({latestYear})
            </p>
            <p className="text-2xl font-bold text-blue-700 mt-1">
              {latestRefinery != null
                ? `${(latestRefinery / 1000).toFixed(0)}mn t`
                : "—"}
            </p>
            <p className="text-xs text-gray-400 mt-1">Total crude processed</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">
              Product Exports ({latestYear})
            </p>
            <p className="text-2xl font-bold text-green-700 mt-1">
              {latestExports != null
                ? `${(latestExports / 1000).toFixed(0)}mn t`
                : "—"}
            </p>
            <p className="text-xs text-gray-400 mt-1">Refined product exports</p>
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-6">
          {/* Crude oil supply: production vs imports */}
          <LineChart
            series={crudeSupplySeries}
            title="Crude Oil: Domestic Production vs Imports"
            subtitle="Annual crude oil production and imports, KToE"
            source={SOURCE}
            sourceUrl={SOURCE_URL}
            yAxisTitle="KToE"
            height={400}
          />

          {/* Refinery throughput */}
          <LineChart
            series={refinerySeries}
            title="Refinery Throughput"
            subtitle="Total crude oil processed by Indian refineries (production + imports), KToE"
            source={SOURCE}
            sourceUrl={SOURCE_URL}
            yAxisTitle="KToE"
            height={350}
          />

          {/* Refined product trade */}
          <LineChart
            series={tradeSeries}
            title="Oil Product Trade"
            subtitle="Refined product exports and imports, KToE — India is a net exporter of refined products"
            source={SOURCE}
            sourceUrl={SOURCE_URL}
            yAxisTitle="KToE"
            height={400}
          />

          {/* Transport & household fuel consumption */}
          <LineChart
            series={keyConsumptionSeries}
            title="Key Fuel Consumption: Transport & Household"
            subtitle="Final consumption of Diesel, Petrol, LPG, and ATF by all sectors, KToE"
            source={SOURCE}
            sourceUrl={SOURCE_URL}
            yAxisTitle="KToE"
            height={400}
          />

          {/* Industrial products consumption */}
          <LineChart
            series={industrialConsumptionSeries}
            title="Industrial & Other Petroleum Products"
            subtitle="Final consumption of Naphtha, Petroleum Coke, Fuel Oil, and Kerosene, KToE"
            source={SOURCE}
            sourceUrl={SOURCE_URL}
            yAxisTitle="KToE"
            height={400}
          />

          {/* Consumption breakdown bar chart — latest year */}
          {(() => {
            const latestBarSeries = consumptionSeries.map((s) => ({
              ...s,
              data: [s.data[latestIdx]].map((d) => ({
                ...d,
                label: s.indicator,
              })),
            }));
            return (
              <BarChart
                series={latestBarSeries}
                title={`Oil Product Consumption Mix (${latestYear})`}
                subtitle={`Final consumption by product type in ${latestYear} — total ${(totalConsLatest / 1000).toFixed(1)} million tonnes`}
                source={SOURCE}
                sourceUrl={SOURCE_URL}
                orientation="h"
                barMode="group"
                height={400}
              />
            );
          })()}
        </div>

        {/* Data source info */}
        <div className="mt-8 p-4 bg-orange-50 rounded-lg border border-orange-100">
          <h3 className="text-sm font-semibold text-orange-900">About this data</h3>
          <p className="text-sm text-orange-700 mt-1">
            Data sourced from{" "}
            <a
              href={SOURCE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-orange-900"
            >
              MoSPI Energy Statistics
            </a>{" "}
            (Energy Balance in KToE). Covers fiscal years 2012-13 to{" "}
            {latestYear}. One KToE ≈ 11.63 MWh of energy. Refinery throughput
            is the sum of domestic crude production and crude oil imports. India
            processes more crude than it consumes domestically, exporting
            significant volumes of refined products (diesel, petrol, naphtha,
            etc.). Kerosene consumption has fallen sharply following the Ujjwala
            LPG scheme (2016 onwards).
          </p>
        </div>
      </div>
    </>
  );
}
