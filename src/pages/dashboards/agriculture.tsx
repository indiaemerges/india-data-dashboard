import Head from "next/head";
import StateMapPanel from "@/components/charts/StateMapPanel";
import {
  useAgricultureData,
  agricultureTotalFoodgrainSeries,
  agricultureKharifRabiSeries,
  agricultureCropsSeries,
  agricultureCropYieldSeries,
  agricultureMSPSeries,
  agricultureFCIStocksSeries,
  agricultureFCIProcurementSeries,
  agricultureFoodgrainVsHorticultureSeries,
  agricultureMonsoonSeries,
} from "@/lib/hooks/useAgriculture";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorDisplay from "@/components/ui/ErrorDisplay";

const SOURCE = "MoAFW; FCI; IMD";
const SOURCE_URL = "https://agricoop.nic.in/";

export default function AgricultureDashboard() {
  const { data, isLoading, error, refetch } = useAgricultureData();

  if (isLoading) return <LoadingSpinner message="Loading agriculture data..." />;
  if (error || !data) {
    return (
      <ErrorDisplay
        message={error instanceof Error ? error.message : "Failed to load agriculture data"}
        onRetry={() => refetch()}
      />
    );
  }

  // Latest values
  const latestYear = data.years.at(-1)!;
  const latestTotal = data.foodgrain.total.at(-1)!;
  const latestRice = data.crops.rice.at(-1)!;
  const latestWheat = data.crops.wheat.at(-1)!;
  const latestMonsoon = data.monsoon.departure.at(-1)!;
  const latestFCITotal =
    data.fciStocks.rice.at(-1)! + data.fciStocks.wheat.at(-1)!;
  const latestHorticulture = data.horticulture.total.at(-1)!;

  // Record year
  const maxTotal = Math.max(...data.foodgrain.total);
  const recordYear = data.years[data.foodgrain.total.indexOf(maxTotal)];

  // Series
  const totalSeries = agricultureTotalFoodgrainSeries(data);
  const kharifRabiSeries = agricultureKharifRabiSeries(data);
  const cropsSeries = agricultureCropsSeries(data);
  const yieldSeries = agricultureCropYieldSeries(data);
  const mspSeries = agricultureMSPSeries(data);
  const fciSeries = agricultureFCIStocksSeries(data);
  const procurementSeries = agricultureFCIProcurementSeries(data);
  const hortFoodgrainSeries = agricultureFoodgrainVsHorticultureSeries(data);
  const monsoonSeries = agricultureMonsoonSeries(data);

  return (
    <>
      <Head>
        <title>Agriculture &amp; Food | India Data Dashboard</title>
        <meta
          name="description"
          content="India agriculture data — foodgrain production, crop trends, MSP, FCI buffer stocks, and monsoon rainfall from MoAFW, FCI, and IMD."
        />
      </Head>

      <div>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Agriculture &amp; Food Security
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-300">
            Foodgrain production, crop trends, Minimum Support Prices, FCI buffer
            stocks, and monsoon rainfall. Annual data from the Ministry of
            Agriculture & Farmers&apos; Welfare, Food Corporation of India, and the
            India Meteorological Department (2000-01 to {latestYear}).
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Foodgrain Production
            </p>
            <p className="text-2xl font-bold text-green-700 mt-1">
              {latestTotal.toFixed(1)} Mt
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {latestYear} — record {maxTotal.toFixed(1)} Mt ({recordYear})
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Rice / Wheat ({latestYear})
            </p>
            <p className="text-2xl font-bold text-blue-700 mt-1">
              {latestRice.toFixed(0)} / {latestWheat.toFixed(0)} Mt
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Two staple crops combined
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Horticulture ({latestYear})
            </p>
            <p className="text-2xl font-bold text-orange-600 mt-1">
              {latestHorticulture.toFixed(1)} Mt
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Fruits + vegetables (exceeds foodgrain)
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              FCI Stocks (Rice + Wheat)
            </p>
            <p className={`text-2xl font-bold mt-1 ${latestFCITotal >= data.fciStocks.bufferNorm ? "text-green-700" : "text-red-600"}`}>
              {latestFCITotal.toFixed(1)} Mt
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Buffer norm: {data.fciStocks.bufferNorm} Mt
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Last Monsoon ({latestYear.slice(0, 4)})
            </p>
            <p className={`text-2xl font-bold mt-1 ${latestMonsoon >= 0 ? "text-green-700" : "text-red-600"}`}>
              {latestMonsoon > 0 ? "+" : ""}{latestMonsoon}%
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Departure from LPA (880.6 mm)
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-6">

          {/* Total foodgrain production */}
          <LineChart
            series={[totalSeries]}
            title="Total Foodgrain Production"
            subtitle="Rice + Wheat + Pulses + Coarse Cereals (Mt) — India has more than doubled production since 2000, with notable dips in 2002-03 and 2009-10 drought years"
            source={SOURCE}
            sourceUrl={SOURCE_URL}
            yAxisTitle="Million Tonnes (Mt)"
            height={400}
            showMarkers={false}
          />

          {/* Kharif vs Rabi */}
          <BarChart
            series={kharifRabiSeries}
            title="Kharif vs Rabi Production"
            subtitle="Seasonal split of foodgrain output (Mt) — Rabi has grown faster than Kharif in recent years, now accounting for more than half of total output"
            source={SOURCE}
            sourceUrl={SOURCE_URL}
            yAxisTitle="Million Tonnes (Mt)"
            barMode="stack"
            height={400}
          />

          {/* Crop breakdown */}
          <LineChart
            series={cropsSeries}
            title="Major Crop Production"
            subtitle="Rice, Wheat, Coarse Cereals, and Pulses (Mt) — Rice and Wheat dominate; Coarse Cereals surging with the Millet Mission; Pulses recovered strongly after 2016"
            source={SOURCE}
            sourceUrl={SOURCE_URL}
            yAxisTitle="Million Tonnes (Mt)"
            height={420}
            showMarkers={false}
          />

          {/* Crop yield */}
          <LineChart
            series={yieldSeries}
            title="Crop Yield — Rice &amp; Wheat"
            subtitle="Yield in kg per hectare — India's rice yield has risen ~50% since 2000; wheat yield growth has been equally impressive, driven by HYV adoption and irrigation expansion"
            source={SOURCE}
            sourceUrl={SOURCE_URL}
            yAxisTitle="kg per hectare"
            height={380}
            showMarkers={false}
          />

          {/* Horticulture vs Foodgrain */}
          <LineChart
            series={hortFoodgrainSeries}
            title="Horticulture vs Foodgrain Production"
            subtitle="Total horticulture (fruits + vegetables + spices + plantations) has surpassed foodgrain — India is now the world's 2nd largest producer of fruits and vegetables"
            source="National Horticulture Board (NHB)"
            sourceUrl="https://nhb.gov.in/"
            yAxisTitle="Million Tonnes (Mt)"
            height={380}
            showMarkers={false}
          />

          {/* MSP trends */}
          <LineChart
            series={mspSeries}
            title="Minimum Support Price (MSP) — Rice &amp; Wheat"
            subtitle="CACP-recommended MSP (₹/quintal) — both staples saw the sharpest rises post-2007; recent years show accelerated hikes ahead of elections"
            source="Commission for Agricultural Costs and Prices (CACP)"
            sourceUrl="https://cacp.dacnet.nic.in/"
            yAxisTitle="₹ per quintal"
            height={380}
            showMarkers={false}
          />

          {/* FCI buffer stocks */}
          <LineChart
            series={fciSeries}
            title="FCI Central Pool Stocks"
            subtitle="Rice and Wheat held by FCI at start of April (Mt) — the grey line is the mandatory buffer norm (21.4 Mt combined). COVID-era procurement (FY21) caused record wheat stock build-up; wheat stocks fell sharply in FY23 after heat-wave crop damage"
            source="Food Corporation of India (FCI)"
            sourceUrl="https://fci.gov.in/"
            yAxisTitle="Million Tonnes (Mt)"
            height={400}
            showMarkers={false}
          />

          {/* FCI procurement */}
          <LineChart
            series={procurementSeries}
            title="FCI Procurement — Rice &amp; Wheat"
            subtitle="Government procurement by FCI + state agencies (Mt) — procurement has more than doubled since 2000 as MSP operations expanded; COVID-era wheat procurement hit record 43 Mt in FY22"
            source="Food Corporation of India (FCI)"
            sourceUrl="https://fci.gov.in/"
            yAxisTitle="Million Tonnes (Mt)"
            height={380}
            showMarkers={false}
          />

          {/* Monsoon departure */}
          <BarChart
            series={[monsoonSeries]}
            title="Southwest Monsoon Rainfall Departure"
            subtitle="% departure from Long Period Average (LPA = 880.6 mm, Jun–Sep) — negative bars are drought years; 2002 (-19%) and 2009 (-23%) were the worst in recent decades"
            source="India Meteorological Department (IMD)"
            sourceUrl="https://imd.gov.in/"
            yAxisTitle="% from LPA"
            height={380}
          />

        </div>

        {/* State Distribution Maps */}
        <StateMapPanel indicators={["rice_prod", "wheat_prod", "rice_yield", "wheat_yield", "sugarcane_prod", "irrigation_pct"]} />

        {/* About */}
        <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
          <h3 className="text-sm font-semibold text-green-900 dark:text-green-200">About this data</h3>
          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
            Foodgrain and crop production figures are 4th Advance Estimates or Final Estimates from the{" "}
            <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer" className="underline hover:text-green-900 dark:hover:text-green-100">
              Directorate of Economics and Statistics, MoAFW
            </a>
            . Crop yield (kg/ha) is derived from production and area estimates.
            Horticulture data is from{" "}
            <a href="https://nhb.gov.in/" target="_blank" rel="noopener noreferrer" className="underline hover:text-green-900 dark:hover:text-green-100">
              National Horticulture Board (NHB)
            </a>{" "}
            Area & Production Statistics. FCI stocks are central pool holdings as on April 1;
            procurement figures are FCI + state agency combined for the marketing season.
            MSP figures are CACP recommendations notified by the Government of India.
            Monsoon data is IMD&apos;s all-India southwest monsoon (Jun–Sep) seasonal rainfall departure
            from the Long Period Average of 880.6 mm (1971–2020 baseline).
          </p>
        </div>
      </div>
    </>
  );
}
