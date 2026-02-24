import Head from "next/head";
import { useWorldBankIndicators } from "@/lib/hooks/useWorldBank";
import { useNASQuarterlyData, nasQuarterlyToSeries, useNASGVASectorData, nasGVAToSeries } from "@/lib/hooks/useMospiNAS";
import { WORLD_BANK_INDICATORS } from "@/lib/api/worldbank";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorDisplay from "@/components/ui/ErrorDisplay";

const GDP_INDICATORS = [
  WORLD_BANK_INDICATORS.GDP_GROWTH,
  WORLD_BANK_INDICATORS.GDP_CURRENT_USD,
  WORLD_BANK_INDICATORS.GDP_PER_CAPITA,
  WORLD_BANK_INDICATORS.GDP_PER_CAPITA_GROWTH,
];

export default function GDPGrowthDashboard() {
  const { data: wbSeries, isLoading: wbLoading, error: wbError, refetch: wbRefetch } =
    useWorldBankIndicators(GDP_INDICATORS, { years: 35 });

  const { data: nasData, isLoading: nasLoading, error: nasError } =
    useNASQuarterlyData();

  const { data: gvaData, isLoading: gvaLoading } = useNASGVASectorData();

  // ── Loading / error states ──────────────────────────────────────────
  if (wbLoading || nasLoading || gvaLoading) {
    return <LoadingSpinner message="Fetching GDP data..." />;
  }

  if (wbError || !wbSeries || wbSeries.length === 0) {
    return (
      <ErrorDisplay
        message={
          wbError instanceof Error
            ? wbError.message
            : "Failed to fetch GDP data from World Bank API"
        }
        onRetry={() => wbRefetch()}
      />
    );
  }

  // ── World Bank annual series ────────────────────────────────────────
  const gdpGrowth = wbSeries.find(
    (s) => s.indicatorId === WORLD_BANK_INDICATORS.GDP_GROWTH
  );
  const gdpUSD = wbSeries.find(
    (s) => s.indicatorId === WORLD_BANK_INDICATORS.GDP_CURRENT_USD
  );
  const gdpPerCapita = wbSeries.find(
    (s) => s.indicatorId === WORLD_BANK_INDICATORS.GDP_PER_CAPITA
  );
  const gdpPerCapitaGrowth = wbSeries.find(
    (s) => s.indicatorId === WORLD_BANK_INDICATORS.GDP_PER_CAPITA_GROWTH
  );

  // ── MoSPI NAS quarterly series ──────────────────────────────────────
  const nasGrowthSeries = nasData
    ? nasQuarterlyToSeries(nasData, "realGrowth")
    : null;
  const nasNominalGDPSeries = nasData
    ? nasQuarterlyToSeries(nasData, "nominalGDP")
    : null;

  // Latest values for summary cards
  const latestGrowth = gdpGrowth?.data[gdpGrowth.data.length - 1];
  const latestGDP = gdpUSD?.data[gdpUSD.data.length - 1];
  const latestPerCapita = gdpPerCapita?.data[gdpPerCapita.data.length - 1];

  // Latest quarterly (MoSPI) — most recent non-null entry
  const latestQuarter = nasData
    ? [...nasData.quarters]
        .reverse()
        .find((q) => q.realGrowth !== null)
    : null;

  // ── GVA broad-sector series (3 lines) ──────────────────────────────
  const gvaBroadSeries = gvaData
    ? nasGVAToSeries(gvaData, ["agriculture", "industry", "services"])
    : null;

  // Latest quarter snapshot for all sectors (bar chart)
  const gvaLatestQuarter = gvaData
    ? [...gvaData.quarters].reverse().find((q) => q.totalGVA !== null)
    : null;

  const gvaSnapshotSeries = gvaLatestQuarter && gvaData
    ? [{
        source: "mospi" as const,
        indicator: `GVA Growth by Sector — ${gvaLatestQuarter.label}`,
        indicatorId: "NAS_GVA_SNAPSHOT",
        unit: "%",
        frequency: "quarterly" as const,
        data: [
          { date: "Agriculture", value: gvaLatestQuarter.agriculture, label: "Agriculture" },
          { date: "Mining & Quarrying", value: gvaLatestQuarter.mining, label: "Mining & Quarrying" },
          { date: "Manufacturing", value: gvaLatestQuarter.manufacturing, label: "Manufacturing" },
          { date: "Electricity & Utilities", value: gvaLatestQuarter.electricity, label: "Electricity & Utilities" },
          { date: "Construction", value: gvaLatestQuarter.construction, label: "Construction" },
          { date: "Trade & Hotels", value: gvaLatestQuarter.tradeHotelsTransport, label: "Trade & Hotels" },
          { date: "Finance & Real Estate", value: gvaLatestQuarter.financialRealEstate, label: "Finance & Real Estate" },
          { date: "Public Administration", value: gvaLatestQuarter.publicAdmin, label: "Public Administration" },
        ].filter((d) => d.value !== null),
        metadata: {
          lastUpdated: gvaData.lastUpdated,
          sourceUrl: gvaData.sourceUrl,
          notes: gvaData.notes,
        },
      }]
    : null;

  return (
    <>
      <Head>
        <title>GDP & Growth | India Data Dashboard</title>
        <meta
          name="description"
          content="India's GDP growth rate, quarterly GDP from MoSPI NAS, and per capita GDP from World Bank."
        />
      </Head>

      <div>
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            GDP & National Accounts
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-300">
            India&apos;s Gross Domestic Product — quarterly data from MoSPI
            National Accounts Statistics and long-run annual data from World
            Bank.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          {/* Latest quarterly growth — MoSPI (most current) */}
          {latestQuarter && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Real GDP Growth ({latestQuarter.label})
              </p>
              <p
                className={`text-2xl font-bold mt-1 ${
                  (latestQuarter.realGrowth ?? 0) >= 0
                    ? "text-green-700 dark:text-green-400"
                    : "text-red-700 dark:text-red-400"
                }`}
              >
                {latestQuarter.realGrowth?.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                YoY, constant prices · MoSPI
              </p>
            </div>
          )}

          {/* Annual growth — World Bank */}
          {latestGrowth && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                GDP Growth ({latestGrowth.date})
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {latestGrowth.value?.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Annual % · World Bank
              </p>
            </div>
          )}

          {/* GDP in USD — World Bank */}
          {latestGDP && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                GDP ({latestGDP.date})
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                ${((latestGDP.value || 0) / 1e12).toFixed(2)}T
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Current USD · World Bank
              </p>
            </div>
          )}

          {/* GDP per capita — World Bank */}
          {latestPerCapita && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                GDP Per Capita ({latestPerCapita.date})
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                ${(latestPerCapita.value || 0).toLocaleString("en-US", {
                  maximumFractionDigits: 0,
                })}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Current USD · World Bank
              </p>
            </div>
          )}
        </div>

        {/* ── Section 1: MoSPI Quarterly GDP ─────────────────────────── */}
        <div className="mb-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Quarterly GDP Growth Rate
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            MoSPI NAS — real (constant 2011-12 prices), year-on-year.{" "}
            <span className="font-medium text-orange-600 dark:text-orange-400">
              Most current: {latestQuarter?.label ?? "—"}
            </span>
          </p>
        </div>

        {nasError || !nasGrowthSeries ? (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              Quarterly GDP data could not be loaded. Run{" "}
              <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">
                npm run generate:nas
              </code>{" "}
              to generate the static data file.
            </p>
          </div>
        ) : (
          <div className="space-y-6 mb-8">
            <LineChart
              series={[nasGrowthSeries]}
              title="India Quarterly Real GDP Growth Rate (%)"
              subtitle="Year-on-year change, constant 2011-12 prices · MoSPI NAS"
              source="MoSPI NAS"
              sourceUrl="https://www.mospi.gov.in/"
              yAxisTitle="Growth Rate (%)"
              height={420}
            />

            {nasNominalGDPSeries && (
              <BarChart
                series={[nasNominalGDPSeries]}
                title="India Quarterly Nominal GDP (₹ Lakh Crore)"
                subtitle="GDP at current prices · MoSPI NAS"
                source="MoSPI NAS"
                sourceUrl="https://www.mospi.gov.in/"
                yAxisTitle="GDP (₹ Lakh Crore)"
                height={380}
              />
            )}
          </div>
        )}

        {/* ── Section 2: World Bank Annual GDP ───────────────────────── */}
        <div className="mb-2 mt-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Annual GDP (Long-run)
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            World Bank Development Indicators — 35-year historical view
          </p>
        </div>

        <div className="space-y-6 mb-8">
          {gdpGrowth && (
            <LineChart
              series={[gdpGrowth]}
              title="India Annual GDP Growth Rate (%)"
              subtitle="Year-over-year change in real GDP · World Bank WDI"
              source="World Bank"
              sourceUrl="https://data.worldbank.org/indicator/NY.GDP.MKTP.KD.ZG?locations=IN"
              yAxisTitle="Growth Rate (%)"
              height={380}
            />
          )}

          {gdpUSD && (
            <BarChart
              series={[
                {
                  ...gdpUSD,
                  indicator: "GDP (Current USD)",
                  data: gdpUSD.data.map((d) => ({
                    ...d,
                    value: d.value ? d.value / 1e9 : null,
                  })),
                },
              ]}
              title="India GDP (Current USD, Billions)"
              subtitle="Nominal GDP at current market prices · World Bank WDI"
              source="World Bank"
              sourceUrl="https://data.worldbank.org/indicator/NY.GDP.MKTP.CD?locations=IN"
              yAxisTitle="GDP (Billion USD)"
              height={380}
            />
          )}

          {gdpPerCapita && gdpPerCapitaGrowth && (
            <LineChart
              series={[gdpPerCapita, gdpPerCapitaGrowth]}
              title="GDP Per Capita"
              subtitle="Per capita GDP in current USD and growth rate · World Bank WDI"
              source="World Bank"
              sourceUrl="https://data.worldbank.org/indicator/NY.GDP.PCAP.CD?locations=IN"
              height={380}
            />
          )}
        </div>

        {/* ── Section 3: GVA by Sector ────────────────────────────────── */}
        <div className="mb-2 mt-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            GVA Growth by Sector
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            MoSPI NAS — real growth (constant 2011-12 prices), year-on-year
          </p>
        </div>

        {!gvaData ? (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              GVA sector data could not be loaded. Run{" "}
              <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">
                npm run generate:gva
              </code>{" "}
              to generate the static data file.
            </p>
          </div>
        ) : (
          <div className="space-y-6 mb-8">
            {/* Chart 1: 3-line broad sectors over time */}
            {gvaBroadSeries && (
              <LineChart
                series={gvaBroadSeries}
                title="GVA Growth — Agriculture, Industry & Services (%)"
                subtitle="Year-on-year real growth, constant 2011-12 prices · MoSPI NAS"
                source="MoSPI NAS"
                sourceUrl="https://www.mospi.gov.in/"
                yAxisTitle="Growth Rate (%)"
                height={420}
              />
            )}

            {/* Chart 2: Latest quarter snapshot — all 8 sectors */}
            {gvaSnapshotSeries && gvaLatestQuarter && (
              <BarChart
                series={gvaSnapshotSeries}
                title={`GVA Growth by Sector — ${gvaLatestQuarter.label}`}
                subtitle="Real year-on-year growth rate across all sectors · MoSPI NAS"
                source="MoSPI NAS"
                sourceUrl="https://www.mospi.gov.in/"
                yAxisTitle="Growth Rate (%)"
                height={360}
                orientation="h"
              />
            )}
          </div>
        )}

        {/* Data source info */}
        <div className="mt-8 space-y-3">
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-800">
            <h3 className="text-sm font-semibold text-orange-900 dark:text-orange-200">
              MoSPI NAS — Quarterly GDP
            </h3>
            <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
              India&apos;s National Statistical Office publishes quarterly GDP
              estimates within ~60 days of each quarter end (Q1=Apr–Jun,
              Q2=Jul–Sep, Q3=Oct–Dec, Q4=Jan–Mar). Growth rates are
              year-on-year comparisons at constant 2011-12 prices. Data
              available from 2011-12 Q1 through the most recently released
              quarter.
            </p>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200">
              World Bank WDI — Annual GDP
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              World Bank Development Indicators provide a long-run annual view
              in USD, useful for international comparisons. Data typically lags
              by 1–2 years behind MoSPI&apos;s own releases.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
