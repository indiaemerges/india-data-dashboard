import Head from "next/head";
import { useNASQuarterlyData, useNASGVASectorData, nasQuarterlyToSeries, nasGVAToSeries } from "@/lib/hooks/useMospiNAS";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorDisplay from "@/components/ui/ErrorDisplay";
import { useState } from "react";

const SOURCE = "MoSPI NAS";
const SOURCE_URL = "https://mospi.gov.in/";
const PRESS_NOTE_URL =
  "https://static.pib.gov.in/WriteReadData/specificdocs/documents/2026/jun/doc202665884801.pdf";

// ── Locked sector color palette (consistent across all charts) ───────────────
const SECTOR_COLORS: Record<string, string> = {
  agriculture:          "#16a34a",
  mining:               "#854d0e",
  manufacturing:        "#2563eb",
  electricity:          "#f59e0b",
  construction:         "#64748b",
  tradeHotelsTransport: "#0891b2",
  financialRealEstate:  "#7c3aed",
  publicAdmin:          "#dc2626",
};

// ── Indicators Annexure data ─────────────────────────────────────────────────
type IndicatorCat = "agri" | "indus" | "trans" | "fiscal" | "trade";

interface Indicator {
  name: string;
  cat: IndicatorCat;
  q4: number | null;
  ann: number | null;
}

const CAT_META: Record<IndicatorCat, { label: string; color: string; bg: string; darkBg: string }> = {
  agri:   { label: "Agriculture", color: "#16a34a", bg: "bg-green-50",   darkBg: "dark:bg-green-900/20"  },
  indus:  { label: "Industry",    color: "#2563eb", bg: "bg-blue-50",    darkBg: "dark:bg-blue-900/20"   },
  trans:  { label: "Transport",   color: "#0891b2", bg: "bg-cyan-50",    darkBg: "dark:bg-cyan-900/20"   },
  fiscal: { label: "Fiscal",      color: "#7c3aed", bg: "bg-violet-50",  darkBg: "dark:bg-violet-900/20" },
  trade:  { label: "Trade/Prices",color: "#ea580c", bg: "bg-orange-50",  darkBg: "dark:bg-orange-900/20" },
};

const INDICATORS: Indicator[] = [
  { name: "Total Food Grain Production",               cat: "agri",   q4: 9.6,   ann: 5.3  },
  { name: "Cereals",                                   cat: "agri",   q4: 10.5,  ann: 5.2  },
  { name: "Rice",                                      cat: "agri",   q4: 10.7,  ann: 2.6  },
  { name: "Wheat",                                     cat: "agri",   q4: 7.2,   ann: 2.3  },
  { name: "Cement Production Index",                   cat: "indus",  q4: 8.2,   ann: 8.7  },
  { name: "Finished Steel Consumption",                cat: "indus",  q4: 10.4,  ann: 8.0  },
  { name: "Natural Gas Consumption",                   cat: "indus",  q4: -2.8,  ann: -3.0 },
  { name: "Sales of Commercial Vehicles",              cat: "trans",  q4: 19.0,  ann: 12.6 },
  { name: "Sales of Three Wheelers",                   cat: "trans",  q4: 26.7,  ann: 12.8 },
  { name: "Cargo Handled at Major Ports",              cat: "trans",  q4: 4.3,   ann: 7.0  },
  { name: "Cargo Handled at Minor Ports",              cat: "trans",  q4: -1.0,  ann: 1.4  },
  { name: "Air Traffic: Domestic",                     cat: "trans",  q4: 3.7,   ann: 3.7  },
  { name: "Air Traffic: International",                cat: "trans",  q4: 11.1,  ann: 9.7  },
  { name: "Railway Net Tonne Km",                      cat: "trans",  q4: 1.9,   ann: 1.4  },
  { name: "Railway Passenger Km",                      cat: "trans",  q4: 4.5,   ann: 5.3  },
  { name: "Central GST (CGST)",                        cat: "fiscal", q4: 9.0,   ann: 6.4  },
  { name: "Custom Duty",                               cat: "fiscal", q4: 9.5,   ann: 13.5 },
  { name: "Union Excise",                              cat: "fiscal", q4: 21.7,  ann: 13.9 },
  { name: "Fertilizer Subsidy (Urea + NBF)",           cat: "fiscal", q4: 44.2,  ann: 21.7 },
  { name: "Household Vehicle Registration",            cat: "trans",  q4: 28.7,  ann: 17.4 },
  { name: "Passenger Transport Vehicle Registration",  cat: "trans",  q4: 19.8,  ann: 14.7 },
  { name: "Goods Transport Vehicle Registration",      cat: "trans",  q4: 27.0,  ann: 18.3 },
  { name: "Export of Goods and Services",              cat: "trade",  q4: 8.3,   ann: 9.3  },
  { name: "Import of Goods and Services",              cat: "trade",  q4: 16.2,  ann: 11.1 },
  { name: "Import of Transport Goods",                 cat: "trade",  q4: -1.9,  ann: 6.0  },
  { name: "Import of Machinery and Equipment",         cat: "trade",  q4: 24.9,  ann: 19.3 },
  { name: "WPI: Food Grains",                          cat: "trade",  q4: -3.1,  ann: -2.5 },
  { name: "WPI: Crude Petroleum and Natural Gas",      cat: "trade",  q4: 8.3,   ann: -5.1 },
  { name: "WPI: Manufactured Products",                cat: "trade",  q4: 3.0,   ann: 2.3  },
];

// ── Cell shading helper ──────────────────────────────────────────────────────
function cellClass(v: number | null): string {
  if (v === null) return "";
  if (v < 0)  return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
  if (v < 3)  return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300";
  if (v < 10) return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
  return "bg-green-200 dark:bg-green-800/40 text-green-900 dark:text-green-200";
}

function fmtPct(v: number | null): string {
  if (v === null) return "n/a";
  return (v > 0 ? "+" : "") + v.toFixed(1) + "%";
}

// ── Annual FY26 provisional data (from press note Statements 1 and 3) ────────
const ANNUAL_REAL = [
  { fy: "FY22-23", gdp: 7.2, gva: 7.2 },
  { fy: "FY23-24", gdp: 7.2, gva: 7.2 },
  { fy: "FY24-25 (FRE)", gdp: 7.1, gva: 7.3 },
  { fy: "FY25-26 (PE)",  gdp: 7.7, gva: 7.9 },
];

const NOMINAL_LEVELS = [
  { fy: "FY22-23",       gdp: 261.18 },
  { fy: "FY23-24",       gdp: 289.84 },
  { fy: "FY24-25 (FRE)", gdp: 318.07 },
  { fy: "FY25-26 (PE)",  gdp: 346.36 },
];

const EXPENDITURE = [
  { item: "PFCE",    fy25: 5.8, fy26: 7.7 },
  { item: "GFCE",   fy25: 6.5, fy26: 5.5 },
  { item: "GFCF",   fy25: 6.4, fy26: 8.2 },
  { item: "Exports", fy25: 6.6, fy26: 6.3 },
  { item: "Imports", fy25: 5.3, fy26: 5.6 },
];

// ── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, color = "text-gray-900 dark:text-white",
}: { label: string; value: string; sub: string; color?: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function GdpFy26ProvisionalDashboard() {
  const { data: nasData,    isLoading: nasLoading,    error: nasError,    refetch } = useNASQuarterlyData();
  const { data: gvaData,    isLoading: gvaLoading                                 } = useNASGVASectorData();

  // Indicator table state
  const [activeCat, setActiveCat]     = useState<IndicatorCat | "all">("all");
  const [sortCol,   setSortCol]       = useState<0 | 1 | 2>(2);
  const [sortAsc,   setSortAsc]       = useState(false);

  if (nasLoading || gvaLoading) return <LoadingSpinner message="Loading FY26 provisional estimates..." />;
  if (nasError || !nasData) {
    return (
      <ErrorDisplay
        message={nasError instanceof Error ? nasError.message : "Failed to load NAS data"}
        onRetry={() => refetch()}
      />
    );
  }

  // ── Chart series (last 8 quarters = FY25 + FY26) ─────────────────────────
  const realGrowthSeries  = nasQuarterlyToSeries(nasData, "realGrowth");
  const nominalGrowthSeries = nasQuarterlyToSeries(nasData, "nominalGrowth");
  const last8Real = {
    ...realGrowthSeries,
    indicator: "Real GDP Growth (%)",
    data: realGrowthSeries.data.slice(-8),
  };
  const last8Nominal = {
    ...nominalGrowthSeries,
    indicator: "Nominal GDP Growth (%)",
    data: nominalGrowthSeries.data.slice(-8),
  };

  // GVA sector series — last 8Q
  const gvaSeries = gvaData
    ? nasGVAToSeries(gvaData, [
        "agriculture", "manufacturing", "construction",
        "tradeHotelsTransport", "financialRealEstate", "publicAdmin",
      ]).map((s) => ({ ...s, data: s.data.slice(-8) }))
    : [];

  // Latest Q4 snapshot from GVA data
  const latestGvaQ = gvaData
    ? [...gvaData.quarters].reverse().find((q) => q.totalGVA !== null)
    : null;

  const q4SnapshotSeries = latestGvaQ && gvaData
    ? [{
        source: "mospi" as const,
        indicator: `GVA Growth by Sector, ${latestGvaQ.label}`,
        indicatorId: "NAS_GVA_Q4_SNAPSHOT",
        unit: "%",
        frequency: "quarterly" as const,
        data: [
          { date: "Agriculture",      value: latestGvaQ.agriculture,          label: "Agriculture" },
          { date: "Mining",           value: latestGvaQ.mining,               label: "Mining" },
          { date: "Manufacturing",    value: latestGvaQ.manufacturing,        label: "Manufacturing" },
          { date: "Electricity",      value: latestGvaQ.electricity,          label: "Electricity" },
          { date: "Construction",     value: latestGvaQ.construction,         label: "Construction" },
          { date: "Trade & Hotels",   value: latestGvaQ.tradeHotelsTransport, label: "Trade & Hotels" },
          { date: "Finance & RE",     value: latestGvaQ.financialRealEstate,  label: "Finance & RE" },
          { date: "Public Admin",     value: latestGvaQ.publicAdmin,          label: "Public Admin" },
        ].filter((d) => d.value !== null),
        metadata: { lastUpdated: gvaData.lastUpdated, sourceUrl: gvaData.sourceUrl },
      }]
    : [];

  // ── Indicator table helpers ───────────────────────────────────────────────
  const filtered = activeCat === "all"
    ? [...INDICATORS]
    : INDICATORS.filter((r) => r.cat === activeCat);

  const sorted = [...filtered].sort((a, b) => {
    if (sortCol === 0) return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    const va = (sortCol === 1 ? a.q4  : a.ann) ?? -999;
    const vb = (sortCol === 1 ? b.q4  : b.ann) ?? -999;
    return sortAsc ? va - vb : vb - va;
  });

  function handleSort(col: 0 | 1 | 2) {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(false); }
  }

  const cats: Array<{ key: IndicatorCat | "all"; label: string }> = [
    { key: "all",    label: "All" },
    { key: "agri",   label: "Agriculture" },
    { key: "indus",  label: "Industry" },
    { key: "trans",  label: "Transport" },
    { key: "fiscal", label: "Fiscal" },
    { key: "trade",  label: "Trade & Prices" },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>GDP FY2025-26 Provisional Estimates | India Data Dashboard</title>
        <meta
          name="description"
          content="MoSPI Provisional Estimates of India GDP for FY2025-26: 7.7% real growth, Q4 sectoral breakdown, expenditure components, and 29 leading indicators."
        />
      </Head>

      <div>
        {/* Page header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              GDP FY2025-26: Provisional Estimates
            </h1>
            <span className="text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-0.5 rounded-full uppercase tracking-wide">
              New · 5 Jun 2026
            </span>
          </div>
          <p className="mt-1 text-gray-600 dark:text-gray-300">
            MoSPI Provisional Estimates of Annual GDP for FY 2025-26 and Q4 (Jan-Mar 2026).
            Released 5 June 2026 at 4:00 PM IST.{" "}
            <a href={PRESS_NOTE_URL} target="_blank" rel="noopener noreferrer"
              className="text-orange-600 dark:text-orange-400 hover:underline">
              Source press note (PDF)
            </a>
          </p>
        </div>

        {/* Flash highlight */}
        <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800 flex gap-3">
          <span className="text-xl shrink-0">📢</span>
          <p className="text-sm text-orange-900 dark:text-orange-200">
            <strong>India&apos;s economy grew 7.7% in real terms in FY2025-26</strong>, the
            fastest pace in three years, up from 7.1% in FY24-25. Nominal GDP reached
            {" "}&#8377;346.4 lakh crore (~$4.0T). Q4 real growth: 7.8%. Manufacturing led
            secondary sector growth at 10.7%; Trade and Finance sectors drove tertiary growth.
          </p>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <KpiCard label="Real GDP Growth"    value="7.7%"       sub="FY26 PE, constant prices"   color="text-green-700 dark:text-green-400" />
          <KpiCard label="Nominal GDP Growth" value="8.9%"       sub="FY26 PE, current prices"    color="text-orange-600 dark:text-orange-400" />
          <KpiCard label="Nominal GDP"        value="&#8377;346.4L Cr" sub="~$4.0 trillion USD"   />
          <KpiCard label="Real GVA Growth"    value="7.9%"       sub="FY26 PE, constant prices"   color="text-blue-700 dark:text-blue-400" />
          <KpiCard label="Q4 Real GDP"        value="7.8%"       sub="Jan-Mar 2026, YoY"          color="text-green-700 dark:text-green-400" />
          <KpiCard label="Per Capita GDP"     value="&#8377;2.27L" sub="+6.8% YoY, FY26 PE"      />
        </div>

        {/* Row 1: Quarterly growth trend + Q4 sector snapshot */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <LineChart
            series={[last8Real, last8Nominal]}
            title="Quarterly GDP Growth Rate (Last 8 Quarters)"
            subtitle="YoY growth at constant and current prices, Q1 FY25 to Q4 FY26"
            source={SOURCE}
            sourceUrl={SOURCE_URL}
            yAxisTitle="Growth Rate (%)"
            height={320}
          />
          {q4SnapshotSeries.length > 0 && (
            <BarChart
              series={q4SnapshotSeries}
              title={`GVA Growth by Sector, ${latestGvaQ?.label ?? "Q4 FY26"}`}
              subtitle="Real YoY growth (%) at constant prices"
              source={SOURCE}
              sourceUrl={SOURCE_URL}
              orientation="h"
              height={320}
            />
          )}
        </div>

        {/* Row 2: GVA sector trend + Annual GDP growth */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {gvaSeries.length > 0 && (
            <LineChart
              series={gvaSeries}
              title="GVA Growth by Sector (Last 8 Quarters)"
              subtitle="Real YoY growth (%) at constant 2022-23 prices"
              source={SOURCE}
              sourceUrl={SOURCE_URL}
              yAxisTitle="Growth Rate (%)"
              height={340}
            />
          )}

          {/* Annual GDP: hand-built bar/line using static data */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              Annual GDP and GVA Growth, FY22-23 to FY25-26 PE
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Real growth (%) at constant 2022-23 prices
            </p>
            <div className="space-y-3">
              {ANNUAL_REAL.map((row) => {
                const isLatest = row.fy.includes("PE");
                return (
                  <div key={row.fy}>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span className={isLatest ? "font-semibold text-gray-900 dark:text-white" : ""}>{row.fy}</span>
                      <span>GDP <strong className={isLatest ? "text-green-700 dark:text-green-400" : ""}>{row.gdp}%</strong>
                        {" "}· GVA <strong className={isLatest ? "text-blue-700 dark:text-blue-400" : ""}>{row.gva}%</strong>
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <div
                        className={`h-5 rounded-sm transition-all ${isLatest ? "bg-green-500" : "bg-green-200 dark:bg-green-800"}`}
                        style={{ width: `${(row.gdp / 10) * 100}%` }}
                        title={`GDP ${row.gdp}%`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
              Source:{" "}
              <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer"
                className="text-orange-600 dark:text-orange-400 hover:underline">
                MoSPI NAS
              </a>{" "}· Statement 1 and 3
            </p>
          </div>
        </div>

        {/* Row 3: Expenditure + Nominal GDP level */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* Expenditure comparison */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              Expenditure Components: Real Growth
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              FY24-25 (FRE) vs FY25-26 (PE) at constant prices
            </p>
            <div className="space-y-3">
              {EXPENDITURE.map((row) => (
                <div key={row.item}>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{row.item}</span>
                    <span>
                      FY25 <strong>{row.fy25}%</strong> · FY26 PE{" "}
                      <strong className="text-orange-600 dark:text-orange-400">{row.fy26}%</strong>
                    </span>
                  </div>
                  <div className="flex gap-1 items-center">
                    <div className="h-3 rounded-sm bg-gray-200 dark:bg-gray-600"
                      style={{ width: `${(row.fy25 / 12) * 100}%` }} title={`FY25: ${row.fy25}%`} />
                    <div className="h-3 rounded-sm bg-orange-400 dark:bg-orange-500"
                      style={{ width: `${(row.fy26 / 12) * 100}%` }} title={`FY26 PE: ${row.fy26}%`} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-3">
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <span className="inline-block w-3 h-2 rounded-sm bg-gray-200 dark:bg-gray-600" /> FY24-25 (FRE)
              </span>
              <span className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                <span className="inline-block w-3 h-2 rounded-sm bg-orange-400" /> FY25-26 (PE)
              </span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              PFCE=Private consumption · GFCE=Govt consumption · GFCF=Investment
            </p>
          </div>

          {/* Nominal GDP levels */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              Nominal GDP Level, FY22-23 to FY25-26 PE
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              &#8377; Lakh Crore at current prices
            </p>
            <div className="space-y-3">
              {NOMINAL_LEVELS.map((row) => {
                const isLatest = row.fy.includes("PE");
                const pct = (row.gdp / 346.36) * 100;
                return (
                  <div key={row.fy}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={`${isLatest ? "font-semibold text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}>
                        {row.fy}
                      </span>
                      <strong className={isLatest ? "text-orange-600 dark:text-orange-400" : "text-gray-600 dark:text-gray-400"}>
                        &#8377;{row.gdp.toFixed(2)}L Cr
                      </strong>
                    </div>
                    <div
                      className={`h-6 rounded-sm ${isLatest ? "bg-orange-500" : "bg-orange-200 dark:bg-orange-900"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
              Source:{" "}
              <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer"
                className="text-orange-600 dark:text-orange-400 hover:underline">
                MoSPI NAS
              </a>{" "}· Statement 2 · FRE = First Revised Estimate · PE = Provisional Estimate
            </p>
          </div>
        </div>

        {/* Indicators annexure table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Leading Indicators: Year-on-Year Growth
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Annexure from MoSPI press note, 5 June 2026 · Q4 (Jan-Mar 2026) and Annual FY2025-26
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {cats.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveCat(key)}
                  className={`text-xs font-semibold px-3 py-1 rounded-full border transition-colors ${
                    activeCat === key
                      ? "bg-orange-600 border-orange-600 text-white"
                      : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-orange-400 hover:text-orange-600 dark:hover:text-orange-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200 dark:border-gray-600">
                  <th
                    onClick={() => handleSort(0)}
                    className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-600 dark:hover:text-gray-200 whitespace-nowrap"
                  >
                    Indicator <span className="opacity-40">↕</span>
                  </th>
                  <th
                    onClick={() => handleSort(1)}
                    className="text-center py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-600 dark:hover:text-gray-200 whitespace-nowrap"
                  >
                    Q4 FY26 (%) <span className="opacity-40">↕</span>
                  </th>
                  <th
                    onClick={() => handleSort(2)}
                    className="text-center py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-600 dark:hover:text-gray-200 whitespace-nowrap"
                  >
                    Annual FY26 (%) <span className="opacity-40">↕</span>
                  </th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row) => {
                  const m = CAT_META[row.cat];
                  return (
                    <tr
                      key={row.name}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-orange-50/40 dark:hover:bg-orange-900/10"
                    >
                      <td className="py-2 px-3 text-gray-800 dark:text-gray-200 font-medium">
                        {row.name}{" "}
                        <span
                          className="ml-1.5 text-xs font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                          style={{ background: m.bg.replace("bg-","").includes("50") ? undefined : undefined, color: m.color,
                            backgroundColor: m.color + "20" }}
                        >
                          {m.label}
                        </span>
                      </td>
                      <td className={`py-1.5 px-3 text-center font-bold text-sm rounded ${cellClass(row.q4)}`}>
                        {fmtPct(row.q4)}
                      </td>
                      <td className={`py-1.5 px-3 text-center font-bold text-sm rounded ${cellClass(row.ann)}`}>
                        {fmtPct(row.ann)}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex flex-col gap-1 min-w-[52px]">
                          <div className="flex items-center gap-1">
                            <div
                              className="h-1.5 rounded-sm"
                              style={{
                                width: `${Math.min(Math.abs(row.q4 ?? 0) / Math.max(Math.abs(row.q4 ?? 0), Math.abs(row.ann ?? 0), 10) * 44, 44)}px`,
                                background: (row.q4 ?? 0) < 0 ? "#ef4444" : "#ea580c",
                              }}
                            />
                            <span className="text-xs text-gray-400">Q4</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div
                              className="h-1.5 rounded-sm opacity-50"
                              style={{
                                width: `${Math.min(Math.abs(row.ann ?? 0) / Math.max(Math.abs(row.q4 ?? 0), Math.abs(row.ann ?? 0), 10) * 44, 44)}px`,
                                background: (row.ann ?? 0) < 0 ? "#ef4444" : "#ea580c",
                              }}
                            />
                            <span className="text-xs text-gray-400">Ann</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
            Cell shading:{" "}
            <span className="bg-green-200 text-green-900 px-1.5 py-0.5 rounded text-xs">strong positive (&gt;10%)</span>{" "}
            <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded text-xs ml-1">moderate (3-10%)</span>{" "}
            <span className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded text-xs ml-1">weak (0-3%)</span>{" "}
            <span className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded text-xs ml-1">negative</span>
          </p>
        </div>

        {/* Methodology notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-800">
            <h3 className="text-sm font-semibold text-orange-900 dark:text-orange-200">About this release</h3>
            <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
              MoSPI released these Provisional Estimates on 5 June 2026, incorporating
              full Q4 (Jan-Mar 2026) data. This is the first comprehensive annual estimate
              for FY2025-26. Base year: <strong>2022-23</strong> (new series, introduced
              Feb 2026). Next revision: First Revised Estimates (FRE) expected January 2027.
            </p>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200">Methodology note</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Estimates follow IMF Quarterly National Accounts Manual 2017, compiled
              using benchmark-indicator method. Q4 incorporates Advance Crop Estimates,
              commercial vehicle sales, air/rail traffic, and PFMS Central Govt data.
              Comprehensive Sources and Methods publication due August 2026.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
