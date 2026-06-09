import Head from "next/head";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import {
  useNASQuarterlyData,
  useNASGVASectorData,
  nasQuarterlyToSeries,
} from "@/lib/hooks/useMospiNAS";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorDisplay from "@/components/ui/ErrorDisplay";
import { defaultLayout, darkLayout, defaultConfig } from "@/config/chart-themes.config";
import { useState } from "react";

const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-80 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
    </div>
  ),
});

const SOURCE_URL = "https://mospi.gov.in/";
const PRESS_NOTE_URL =
  "https://static.pib.gov.in/WriteReadData/specificdocs/documents/2026/jun/doc202665884801.pdf";

// ── Locked sector palette ────────────────────────────────────────────────────
// One fixed color per sector — same across bar charts, line chart, and table.
const SC = {
  agriculture:          "#16a34a",
  mining:               "#854d0e",
  manufacturing:        "#2563eb",
  electricity:          "#f59e0b",
  construction:         "#64748b",
  tradeHotelsTransport: "#0891b2",
  financialRealEstate:  "#7c3aed",
  publicAdmin:          "#dc2626",
};
const SECTOR_ORDER = Object.keys(SC) as (keyof typeof SC)[];
const SECTOR_LABELS: Record<keyof typeof SC, string> = {
  agriculture:          "Agriculture",
  mining:               "Mining",
  manufacturing:        "Manufacturing",
  electricity:          "Electricity",
  construction:         "Construction",
  tradeHotelsTransport: "Trade & Hotels",
  financialRealEstate:  "Finance & RE",
  publicAdmin:          "Public Admin",
};

// ── Static press-note data ───────────────────────────────────────────────────
// Annual growth — real (Stmt 1) and nominal (Stmt 2), base year 2022-23
const ANNUAL_REAL = [
  { fy: "FY22-23",       gdp: 7.2, gva: 7.2 },
  { fy: "FY23-24",       gdp: 7.2, gva: 7.2 },
  { fy: "FY24-25 (FRE)", gdp: 7.1, gva: 7.3 },
  { fy: "FY25-26 (PE)",  gdp: 7.7, gva: 7.9 },
];
const ANNUAL_NOM = [
  { fy: "FY22-23",       gdp: 11.0, gva: 10.7 },
  { fy: "FY23-24",       gdp: 11.0, gva: 10.7 },
  { fy: "FY24-25 (FRE)", gdp:  9.7, gva:  9.6 },
  { fy: "FY25-26 (PE)",  gdp:  8.9, gva:  9.1 },
];

// GDP level ₹ lakh crore — real (Stmt 1) and nominal (Stmt 2)
const LEVEL_REAL = [
  { fy: "FY22-23",       gdp: 261.18 },
  { fy: "FY23-24",       gdp: 280.01 },
  { fy: "FY24-25 (FRE)", gdp: 299.89 },
  { fy: "FY25-26 (PE)",  gdp: 323.12 },
];
const LEVEL_NOM = [
  { fy: "FY22-23",       gdp: 261.18 },
  { fy: "FY23-24",       gdp: 289.84 },
  { fy: "FY24-25 (FRE)", gdp: 318.07 },
  { fy: "FY25-26 (PE)",  gdp: 346.36 },
];

// Expenditure growth — real (Stmt 1) and nominal (Stmt 2)
const EXPENDITURE_REAL = [
  { item: "PFCE",    fy25: 5.8, fy26: 7.7 },
  { item: "GFCE",   fy25: 6.5, fy26: 5.5 },
  { item: "GFCF",   fy25: 6.4, fy26: 8.2 },
  { item: "Exports", fy25: 6.6, fy26: 6.3 },
  { item: "Imports", fy25: 5.3, fy26: 5.6 },
];
const EXPENDITURE_NOM = [
  { item: "PFCE",    fy25: 9.7, fy26: 9.4 },
  { item: "GFCE",   fy25: 10.5, fy26: 8.7 },
  { item: "GFCF",   fy25: 8.9,  fy26: 9.9 },
  { item: "Exports", fy25: 8.3, fy26: 9.3 },
  { item: "Imports", fy25: 9.2, fy26: 11.3 },
];

// Annual GVA by sector — real (Stmt 3) and nominal (Stmt 4)
const SECTOR_ANNUAL_REAL: Record<keyof typeof SC, { fy25: number; fy26: number }> = {
  agriculture:          { fy25: 4.2,  fy26: 3.0  },
  mining:               { fy25: 11.7, fy26: 5.2  },
  manufacturing:        { fy25: 9.3,  fy26: 10.7 },
  electricity:          { fy25: 2.9,  fy26: 1.7  },
  construction:         { fy25: 7.3,  fy26: 7.4  },
  tradeHotelsTransport: { fy25: 6.6,  fy26: 11.0 },
  financialRealEstate:  { fy25: 10.0, fy26: 10.4 },
  publicAdmin:          { fy25: 5.0,  fy26: 5.0  },
};
const SECTOR_ANNUAL_NOM: Record<keyof typeof SC, { fy25: number; fy26: number }> = {
  // Statement 4: Provisional Estimates of GVA by Economic Activity at Current Prices
  agriculture:          { fy25:  9.2, fy26:  1.4 },
  mining:               { fy25:  6.4, fy26:  4.5 },
  manufacturing:        { fy25:  8.3, fy26: 11.6 },
  electricity:          { fy25: 10.0, fy26:  1.9 },
  construction:         { fy25:  7.5, fy26:  8.4 },
  tradeHotelsTransport: { fy25:  7.6, fy26: 12.4 },
  financialRealEstate:  { fy25: 13.1, fy26: 12.8 },
  publicAdmin:          { fy25:  9.0, fy26: 10.0 },
};

// Q4 GVA by sector — real (Stmt 6) and nominal (Stmt 8)
const SECTOR_Q4_REAL: Record<keyof typeof SC, number> = {
  agriculture:          3.6,
  mining:               5.4,
  manufacturing:        7.3,
  electricity:          4.1,
  construction:         8.4,
  tradeHotelsTransport: 12.5,
  financialRealEstate:  10.4,
  publicAdmin:          5.8,
};
const SECTOR_Q4_NOM: Record<keyof typeof SC, number> = {
  // Statement 8 Q4 FY25-26 nominal growth rates (current prices)
  agriculture:           2.8,
  mining:               11.3,
  manufacturing:         9.9,
  electricity:           0.9,
  construction:         10.5,
  tradeHotelsTransport: 13.9,
  financialRealEstate:  13.1,
  publicAdmin:          11.5,
};

// Quarterly GVA nominal heatmap — Statement 8 (current prices)
// 8 sectors × 8 quarters: Q1 FY24-25 through Q4 FY25-26
const GVA_HEATMAP_NOM: Record<keyof typeof SC, number[]> = {
  agriculture:          [  8.0,   6.9,  11.4,   9.4,   4.8,  -0.1,  -1.5,   2.8],
  mining:               [ 11.9,   3.1,   5.4,   5.3,  -3.0,   1.7,   6.9,  11.3],
  manufacturing:        [  7.5,   3.9,   9.9,  11.5,  10.1,  13.1,  13.3,   9.9],
  electricity:          [ 17.3,   7.7,   7.2,   8.5,   1.5,   5.1,   0.2,   0.9],
  construction:         [  8.0,   6.0,   6.8,   9.3,   6.4,   9.5,   7.1,  10.5],
  tradeHotelsTransport: [  8.3,   7.3,   7.0,   8.0,  11.3,  11.4,  12.7,  13.9],
  financialRealEstate:  [ 13.3,  13.1,  14.7,  11.5,  12.2,  12.5,  13.2,  13.1],
  publicAdmin:          [ 11.0,   9.5,   8.5,   7.2,   8.1,   9.6,  10.4,  11.5],
};

// Broad sector — real (Stmt 3) and nominal (Stmt 4)
const BROAD_REAL = [
  { sector: "Primary",   fy24: 2.6,  fy25: 4.9, fy26: 3.2, color: "#16a34a" },
  { sector: "Secondary", fy24: 11.6, fy25: 8.0, fy26: 8.8, color: "#2563eb" },
  { sector: "Tertiary",  fy24: 7.0,  fy25: 7.9, fy26: 9.3, color: "#ea580c" },
];
const BROAD_NOM = [
  { sector: "Primary",   fy24: 7.5,  fy25: 9.0,  fy26: 1.6,  color: "#16a34a" },
  { sector: "Secondary", fy24: 11.1, fy25: 8.2,  fy26: 9.5,  color: "#2563eb" },
  { sector: "Tertiary",  fy24: 11.9, fy25: 10.6, fy26: 12.0, color: "#ea580c" },
];

// ── Indicators Annexure ──────────────────────────────────────────────────────
type IndCat = "agri" | "indus" | "trans" | "fiscal" | "trade";
interface Indicator { name: string; cat: IndCat; q4: number | null; ann: number | null; }

const CAT_META: Record<IndCat, { label: string; color: string }> = {
  agri:   { label: "Agriculture",  color: "#16a34a" },
  indus:  { label: "Industry",     color: "#2563eb" },
  trans:  { label: "Transport",    color: "#0891b2" },
  fiscal: { label: "Fiscal",       color: "#7c3aed" },
  trade:  { label: "Trade/Prices", color: "#ea580c" },
};

const INDICATORS: Indicator[] = [
  { name: "Total Food Grain Production",              cat: "agri",   q4: 9.6,   ann: 5.3  },
  { name: "Cereals",                                  cat: "agri",   q4: 10.5,  ann: 5.2  },
  { name: "Rice",                                     cat: "agri",   q4: 10.7,  ann: 2.6  },
  { name: "Wheat",                                    cat: "agri",   q4: 7.2,   ann: 2.3  },
  { name: "Cement Production Index",                  cat: "indus",  q4: 8.2,   ann: 8.7  },
  { name: "Finished Steel Consumption",               cat: "indus",  q4: 10.4,  ann: 8.0  },
  { name: "Natural Gas Consumption",                  cat: "indus",  q4: -2.8,  ann: -3.0 },
  { name: "Sales of Commercial Vehicles",             cat: "trans",  q4: 19.0,  ann: 12.6 },
  { name: "Sales of Three Wheelers",                  cat: "trans",  q4: 26.7,  ann: 12.8 },
  { name: "Cargo Handled at Major Ports",             cat: "trans",  q4: 4.3,   ann: 7.0  },
  { name: "Cargo Handled at Minor Ports",             cat: "trans",  q4: -1.0,  ann: 1.4  },
  { name: "Air Traffic: Domestic",                    cat: "trans",  q4: 3.7,   ann: 3.7  },
  { name: "Air Traffic: International",               cat: "trans",  q4: 11.1,  ann: 9.7  },
  { name: "Railway Net Tonne Km",                     cat: "trans",  q4: 1.9,   ann: 1.4  },
  { name: "Railway Passenger Km",                     cat: "trans",  q4: 4.5,   ann: 5.3  },
  { name: "Central GST (CGST)",                       cat: "fiscal", q4: 9.0,   ann: 6.4  },
  { name: "Custom Duty",                              cat: "fiscal", q4: 9.5,   ann: 13.5 },
  { name: "Union Excise",                             cat: "fiscal", q4: 21.7,  ann: 13.9 },
  { name: "Fertilizer Subsidy (Urea + NBF)",          cat: "fiscal", q4: 44.2,  ann: 21.7 },
  { name: "Household Vehicle Registration",           cat: "trans",  q4: 28.7,  ann: 17.4 },
  { name: "Passenger Transport Vehicle Registration", cat: "trans",  q4: 19.8,  ann: 14.7 },
  { name: "Goods Transport Vehicle Registration",     cat: "trans",  q4: 27.0,  ann: 18.3 },
  { name: "Export of Goods and Services",             cat: "trade",  q4: 8.3,   ann: 9.3  },
  { name: "Import of Goods and Services",             cat: "trade",  q4: 16.2,  ann: 11.1 },
  { name: "Import of Transport Goods",                cat: "trade",  q4: -1.9,  ann: 6.0  },
  { name: "Import of Machinery and Equipment",        cat: "trade",  q4: 24.9,  ann: 19.3 },
  { name: "WPI: Food Grains",                         cat: "trade",  q4: -3.1,  ann: -2.5 },
  { name: "WPI: Crude Petroleum and Natural Gas",     cat: "trade",  q4: 8.3,   ann: -5.1 },
  { name: "WPI: Manufactured Products",               cat: "trade",  q4: 3.0,   ann: 2.3  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function cellClass(v: number | null) {
  if (v === null) return "";
  if (v < 0)  return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
  if (v < 3)  return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300";
  if (v < 10) return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
  return "bg-green-200 dark:bg-green-800/40 text-green-900 dark:text-green-200";
}
const fmt = (v: number | null) =>
  v === null ? "n/a" : (v > 0 ? "+" : "") + v.toFixed(1) + "%";

// ── Per-chart price toggle ────────────────────────────────────────────────────
type Prices = "real" | "nominal";

function PriceToggle({ value, onChange }: { value: Prices; onChange: (p: Prices) => void }) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      {(["real", "nominal"] as Prices[]).map((p) => (
        <button key={p} onClick={() => onChange(p)}
          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border transition-colors ${
            value === p
              ? "bg-orange-600 border-orange-600 text-white"
              : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-orange-400 hover:text-orange-600 dark:hover:text-orange-400"
          }`}
        >
          {p === "real" ? "Real" : "Nominal"}
        </button>
      ))}
    </div>
  );
}

function KpiCard({ label, value, sub, color = "text-gray-900 dark:text-white" }: {
  label: string; value: string; sub: string; color?: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>
    </div>
  );
}

function ChartCard({ title, subtitle, children, source, sourceUrl, toggle }: {
  title: string; subtitle?: string; children: React.ReactNode;
  source?: string; sourceUrl?: string; toggle?: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-start justify-between gap-3 mb-0.5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
        {toggle}
      </div>
      {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 mb-3">{subtitle}</p>}
      {children}
      {source && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          Source:{" "}
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer"
            className="text-orange-500 hover:underline">{source}</a>
        </p>
      )}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function GdpFy26ProvisionalDashboard() {
  const { data: nasData, isLoading: nasLoading, error: nasError, refetch } = useNASQuarterlyData();
  const { data: gvaData, isLoading: gvaLoading } = useNASGVASectorData();

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const base = isDark ? darkLayout : defaultLayout;

  const [activeCat, setActiveCat] = useState<IndCat | "all">("all");
  const [sortCol, setSortCol]     = useState<0 | 1 | 2>(2);
  const [sortAsc, setSortAsc]     = useState(false);

  // Per-chart price toggles (default: real)
  const [pQtr,     setPQtr]     = useState<Prices>("real");
  const [pHeatmap, setPHeatmap] = useState<Prices>("real");
  const [pQ4Sec,   setPQ4Sec]   = useState<Prices>("real");
  const [pSecAnn,  setPSecAnn]  = useState<Prices>("real");
  const [pAnnGdp,  setPAnnGdp]  = useState<Prices>("real");
  const [pLevel,   setPLevel]   = useState<Prices>("real");
  const [pExp,     setPExp]     = useState<Prices>("real");
  const [pBroad,   setPBroad]   = useState<Prices>("real");

  // Helper: resolve data for a given toggle value
  const ann    = (p: Prices) => p === "nominal" ? ANNUAL_NOM      : ANNUAL_REAL;
  const level  = (p: Prices) => p === "nominal" ? LEVEL_NOM       : LEVEL_REAL;
  const exp    = (p: Prices) => p === "nominal" ? EXPENDITURE_NOM : EXPENDITURE_REAL;
  const secAnn = (p: Prices) => p === "nominal" ? SECTOR_ANNUAL_NOM : SECTOR_ANNUAL_REAL;
  const secQ4  = (p: Prices) => p === "nominal" ? SECTOR_Q4_NOM   : SECTOR_Q4_REAL;
  const broad  = (p: Prices) => p === "nominal" ? BROAD_NOM       : BROAD_REAL;
  const pLabel = (p: Prices) => p === "nominal" ? "Current prices" : "Constant 2022-23 prices";

  if (nasLoading || gvaLoading) return <LoadingSpinner message="Loading FY26 provisional estimates..." />;
  if (nasError || !nasData) {
    return (
      <ErrorDisplay
        message={nasError instanceof Error ? nasError.message : "Failed to load NAS data"}
        onRetry={() => refetch()}
      />
    );
  }

  // ── Quarterly growth series (last 8 quarters) ────────────────────────────
  const realSeries    = nasQuarterlyToSeries(nasData, "realGrowth");
  const nominalSeries = nasQuarterlyToSeries(nasData, "nominalGrowth");
  const last8real    = realSeries.data.slice(-8);
  const last8nominal = nominalSeries.data.slice(-8);
  const qLabels      = last8real.map((d) => d.date);

  // ── Q4 sector snapshot ───────────────────────────────────────────────────
  const q4Labels  = SECTOR_ORDER.map((k) => SECTOR_LABELS[k]);
  const q4Colors  = SECTOR_ORDER.map((k) => SC[k]);
  const latestGvaQ = gvaData ? [...gvaData.quarters].reverse().find((q) => q.totalGVA !== null) : null;

  // ── Expenditure and sector bar colors ─────────────────────────────────────
  const expColors           = ["#2563eb", "#7c3aed", "#ea580c", "#0891b2", "#dc2626"];
  const sectorLabelsOrdered = SECTOR_ORDER.map((k) => SECTOR_LABELS[k]);
  const sectorColors        = SECTOR_ORDER.map((k) => SC[k]);

  // ── Layout helpers ────────────────────────────────────────────────────────
  function plotLayout(overrides: Partial<Plotly.Layout> = {}): Partial<Plotly.Layout> {
    return {
      ...base,
      ...overrides,
      xaxis: { ...base.xaxis, ...(overrides.xaxis ?? {}) },
      yaxis: { ...base.yaxis, ...(overrides.yaxis ?? {}) },
      legend: { ...base.legend, ...(overrides.legend ?? {}) },
      margin: { ...base.margin, ...(overrides.margin ?? {}) },
    };
  }

  // ── Indicator table ───────────────────────────────────────────────────────
  const filtered = activeCat === "all" ? [...INDICATORS] : INDICATORS.filter((r) => r.cat === activeCat);
  const sorted   = [...filtered].sort((a, b) => {
    if (sortCol === 0) return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    const va = (sortCol === 1 ? a.q4 : a.ann) ?? -999;
    const vb = (sortCol === 1 ? b.q4 : b.ann) ?? -999;
    return sortAsc ? va - vb : vb - va;
  });
  const cats: Array<{ key: IndCat | "all"; label: string }> = [
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
        <meta name="description" content="MoSPI Provisional Estimates for FY2025-26: 7.7% real growth, Q4 sectoral breakdown, expenditure components, 29 leading indicators." />
      </Head>

      <div>
        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              GDP FY2025-26: Provisional Estimates
            </h1>
            <span className="text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-0.5 rounded-full uppercase tracking-wide">
              New · 5 Jun 2026
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            MoSPI Provisional Estimates of Annual GDP for FY 2025-26 and Q4 (Jan-Mar 2026).
            Released 5 June 2026 at 4:00 PM IST.{" "}
            <a href={PRESS_NOTE_URL} target="_blank" rel="noopener noreferrer"
              className="text-orange-600 dark:text-orange-400 hover:underline">
              Source press note (PDF)
            </a>
          </p>
        </div>

        {/* Flash banner */}
        <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800 flex gap-3">
          <span className="text-xl shrink-0">📢</span>
          <p className="text-sm text-orange-900 dark:text-orange-200">
            <strong>India&apos;s economy grew 7.7% in real terms in FY2025-26</strong>, the
            fastest pace in three years, up from 7.1% in FY24-25. Nominal GDP reached
            {" "}&#8377;346.4 lakh crore (~$4.0T). Q4 real growth: 7.8%. Manufacturing led
            secondary sector at 10.7%; Trade and Finance drove tertiary growth.
          </p>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <KpiCard label="Real GDP Growth"    value="7.7%"           sub="FY26 PE, constant prices"  color="text-green-700 dark:text-green-400" />
          <KpiCard label="Nominal GDP Growth" value="8.9%"           sub="FY26 PE, current prices"   color="text-orange-600 dark:text-orange-400" />
          <KpiCard label="Nominal GDP"        value="&#8377;346.4L Cr" sub="~$4.0 trillion USD"      />
          <KpiCard label="Real GVA Growth"    value="7.9%"           sub="FY26 PE, constant prices"  color="text-blue-700 dark:text-blue-400" />
          <KpiCard label="Q4 Real GDP"        value="7.8%"           sub="Jan-Mar 2026, YoY"         color="text-green-700 dark:text-green-400" />
          <KpiCard label="Per Capita GDP"     value="&#8377;2.27L"   sub="+6.8% YoY, FY26 PE"       />
        </div>

        {/* Row 1: Quarterly GDP growth line + Q4 sector snapshot */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ChartCard
            title="Quarterly GDP Growth Rate (Last 8 Quarters)"
            subtitle={`YoY growth at ${pLabel(pQtr)}, Q1 FY25 to Q4 FY26`}
            source="MoSPI NAS" sourceUrl={SOURCE_URL}
            toggle={<PriceToggle value={pQtr} onChange={setPQtr} />}
          >
            <Plot
              data={pQtr === "nominal" ? [
                {
                  type: "scatter", mode: "lines+markers",
                  name: "Nominal GDP Growth (%)",
                  x: qLabels, y: last8nominal.map((d) => d.value),
                  line: { color: "#ea580c", width: 2.5 },
                  marker: { color: "#ea580c", size: 6 },
                  fill: "tozeroy", fillcolor: "rgba(234,88,12,0.08)",
                  hovertemplate: "<b>Nominal GDP</b><br>%{x}: %{y:.1f}%<extra></extra>",
                },
              ] : [
                {
                  type: "scatter", mode: "lines+markers",
                  name: "Real GDP Growth (%)",
                  x: qLabels, y: last8real.map((d) => d.value),
                  line: { color: "#16a34a", width: 2.5 },
                  marker: { color: "#16a34a", size: 6 },
                  fill: "tozeroy", fillcolor: "rgba(22,163,74,0.08)",
                  hovertemplate: "<b>Real GDP</b><br>%{x}: %{y:.1f}%<extra></extra>",
                },
                {
                  type: "scatter", mode: "lines+markers",
                  name: "Nominal GDP Growth (%)",
                  x: qLabels, y: last8nominal.map((d) => d.value),
                  line: { color: "#ea580c", width: 2, dash: "dot" },
                  marker: { color: "#ea580c", size: 5 },
                  hovertemplate: "<b>Nominal GDP</b><br>%{x}: %{y:.1f}%<extra></extra>",
                },
              ]}
              layout={plotLayout({ height: 320, margin: { ...base.margin, t: 20 } })}
              config={defaultConfig}
              useResizeHandler style={{ width: "100%" }}
            />
          </ChartCard>

          <ChartCard
            title={`GVA Growth by Sector, ${latestGvaQ?.label ?? "Q4 FY26"}`}
            subtitle={`Growth (%) at ${pLabel(pQ4Sec)}`}
            source="MoSPI NAS" sourceUrl={SOURCE_URL}
            toggle={<PriceToggle value={pQ4Sec} onChange={setPQ4Sec} />}
          >
            <Plot
              data={[{
                type: "bar", orientation: "h",
                x: SECTOR_ORDER.map((k) => secQ4(pQ4Sec)[k]), y: q4Labels,
                marker: { color: q4Colors },
                hovertemplate: "<b>%{y}</b>: %{x:.1f}%<extra></extra>",
                showlegend: false,
              }]}
              layout={plotLayout({
                height: 320,
                margin: { l: 110, r: 20, t: 20, b: 50 },
                xaxis: { ...base.xaxis, title: { text: "Growth (%)" } },
                yaxis: { ...base.yaxis, autorange: "reversed" },
                showlegend: false,
              })}
              config={defaultConfig}
              useResizeHandler style={{ width: "100%" }}
            />
          </ChartCard>
        </div>

        {/* Row 2: GVA sector line (last 8Q) + Annual GVA by sector (grouped bar) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ChartCard
            title="GVA Growth by Sector (Last 8 Quarters)"
            subtitle={`YoY growth (%) at ${pLabel(pHeatmap)} — cell color = growth rate`}
            source="MoSPI NAS" sourceUrl={SOURCE_URL}
            toggle={<PriceToggle value={pHeatmap} onChange={setPHeatmap} />}
          >
            <Plot
              data={[{
                type: "heatmap",
                x: gvaData ? gvaData.quarters.slice(-8).map((q) =>
                  q.label.replace(/^(\d{4}-\d{2}) (Q\d)$/, "$2 $1")
                ) : [],
                y: [...SECTOR_ORDER].reverse().map((k) => SECTOR_LABELS[k]),
                z: pHeatmap === "nominal"
                  ? [...SECTOR_ORDER].reverse().map((k) => GVA_HEATMAP_NOM[k])
                  : [...SECTOR_ORDER].reverse().map((k) =>
                      gvaData ? gvaData.quarters.slice(-8).map((q) => q[k] ?? null) : []
                    ),
                colorscale: [
                  [0.0,  "#7f1d1d"],
                  [0.15, "#ef4444"],
                  [0.30, "#fbbf24"],
                  [0.50, "#86efac"],
                  [0.70, "#16a34a"],
                  [1.0,  "#14532d"],
                ],
                zmin: -4,
                zmax: 18,
                colorbar: {
                  title: { text: "%", side: "right" },
                  tickfont: { size: 11, color: isDark ? "#9ca3af" : "#6b7280" },
                  thickness: 14,
                  len: 0.9,
                },
                xgap: 2,
                ygap: 2,
                hovertemplate:
                  "<b>%{y}</b><br>%{x}<br>Growth: <b>%{z:.1f}%</b><extra></extra>",
                texttemplate: "%{z:.1f}",
                textfont: { size: 10, color: "white" },
              }]}
              layout={plotLayout({
                height: 360,
                margin: { l: 120, r: 80, t: 20, b: 80 },
                xaxis: {
                  ...base.xaxis,
                  tickangle: -35,
                  tickfont: { size: 11 },
                  side: "bottom",
                },
                yaxis: {
                  ...base.yaxis,
                  tickfont: { size: 11 },
                  autorange: true,
                },
                showlegend: false,
              })}
              config={defaultConfig}
              useResizeHandler style={{ width: "100%" }}
            />
          </ChartCard>

          <ChartCard
            title="Annual GVA Growth by Sector, FY25 vs FY26 PE"
            subtitle={`Growth (%) at ${pLabel(pSecAnn)}`}
            source="MoSPI NAS" sourceUrl={SOURCE_URL}
            toggle={<PriceToggle value={pSecAnn} onChange={setPSecAnn} />}
          >
            <Plot
              data={[
                {
                  type: "bar", orientation: "h", name: "FY24-25 (FRE)",
                  x: SECTOR_ORDER.map((k) => secAnn(pSecAnn)[k].fy25), y: sectorLabelsOrdered,
                  marker: { color: sectorColors.map((c) => c + "55") },
                  hovertemplate: "<b>%{y}</b> FY25: %{x:.1f}%<extra></extra>",
                },
                {
                  type: "bar", orientation: "h", name: "FY25-26 (PE)",
                  x: SECTOR_ORDER.map((k) => secAnn(pSecAnn)[k].fy26), y: sectorLabelsOrdered,
                  marker: { color: sectorColors },
                  hovertemplate: "<b>%{y}</b> FY26 PE: %{x:.1f}%<extra></extra>",
                },
              ]}
              layout={plotLayout({
                barmode: "group",
                height: 380,
                margin: { l: 110, r: 20, t: 20, b: 90 },
                xaxis: { ...base.xaxis, title: { text: "Growth (%)", standoff: 15 } },
                yaxis: { ...base.yaxis, autorange: "reversed" },
                legend: { ...base.legend, orientation: "h", x: 0, y: -0.22, xanchor: "left" },
              })}
              config={defaultConfig}
              useResizeHandler style={{ width: "100%" }}
            />
          </ChartCard>
        </div>

        {/* Row 3: Annual GDP growth + Nominal GDP level */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ChartCard
            title="Annual GDP and GVA Growth, FY22-23 to FY25-26 PE"
            subtitle={`Growth (%) at ${pLabel(pAnnGdp)}`}
            source="MoSPI NAS" sourceUrl={SOURCE_URL}
            toggle={<PriceToggle value={pAnnGdp} onChange={setPAnnGdp} />}
          >
            <Plot
              data={[
                {
                  type: "bar", name: `${pAnnGdp === "nominal" ? "Nominal" : "Real"} GDP Growth (%)`,
                  x: ann(pAnnGdp).map((r) => r.fy), y: ann(pAnnGdp).map((r) => r.gdp),
                  marker: { color: ann(pAnnGdp).map((_, i) => (i === 3 ? "#16a34a" : "rgba(22,163,74,0.35)")) },
                  hovertemplate: "<b>GDP</b> %{x}: %{y:.1f}%<extra></extra>",
                },
                {
                  type: "bar", name: `${pAnnGdp === "nominal" ? "Nominal" : "Real"} GVA Growth (%)`,
                  x: ann(pAnnGdp).map((r) => r.fy), y: ann(pAnnGdp).map((r) => r.gva),
                  marker: { color: ann(pAnnGdp).map((_, i) => (i === 3 ? "#2563eb" : "rgba(37,99,235,0.35)")) },
                  hovertemplate: "<b>GVA</b> %{x}: %{y:.1f}%<extra></extra>",
                },
              ]}
              layout={plotLayout({
                barmode: "group",
                height: 300,
                margin: { ...base.margin, t: 20 },
                yaxis: { ...base.yaxis, title: { text: "Growth (%)" }, range: [0, 10] },
              })}
              config={defaultConfig}
              useResizeHandler style={{ width: "100%" }}
            />
          </ChartCard>

          <ChartCard
            title={`${pLevel === "nominal" ? "Nominal" : "Real"} GDP Level, FY22-23 to FY25-26 PE`}
            subtitle={`&#8377; Lakh Crore at ${pLabel(pLevel)}`}
            source="MoSPI NAS" sourceUrl={SOURCE_URL}
            toggle={<PriceToggle value={pLevel} onChange={setPLevel} />}
          >
            <Plot
              data={[{
                type: "bar",
                x: level(pLevel).map((r) => r.fy),
                y: level(pLevel).map((r) => r.gdp),
                marker: { color: level(pLevel).map((_, i) => (i === 3 ? "#ea580c" : "rgba(234,88,12,0.35)")) },
                text: level(pLevel).map((r) => `&#8377;${r.gdp.toFixed(1)}L Cr`),
                textposition: "outside",
                hovertemplate: "<b>%{x}</b>: &#8377;%{y:.2f}L Cr<extra></extra>",
                showlegend: false,
              }]}
              layout={plotLayout({
                height: 300,
                margin: { ...base.margin, t: 20 },
                yaxis: { ...base.yaxis, title: { text: "&#8377; Lakh Crore" }, range: [200, 380] },
              })}
              config={defaultConfig}
              useResizeHandler style={{ width: "100%" }}
            />
          </ChartCard>
        </div>

        {/* Row 4: Expenditure */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ChartCard
            title="Expenditure Components: Growth, FY25 vs FY26 PE"
            subtitle={`Year-on-year growth (%) at ${pLabel(pExp)} · Statement ${pExp === "nominal" ? "2" : "1"}`}
            source="MoSPI NAS" sourceUrl={SOURCE_URL}
            toggle={<PriceToggle value={pExp} onChange={setPExp} />}
          >
            <Plot
              data={[
                {
                  type: "bar", name: "FY24-25 (FRE)",
                  x: exp(pExp).map((r) => r.item),
                  y: exp(pExp).map((r) => r.fy25),
                  marker: { color: expColors.map((c) => c + "55") },
                  hovertemplate: "<b>%{x}</b> FY25: %{y:.1f}%<extra></extra>",
                },
                {
                  type: "bar", name: "FY25-26 (PE)",
                  x: exp(pExp).map((r) => r.item),
                  y: exp(pExp).map((r) => r.fy26),
                  marker: { color: expColors },
                  hovertemplate: "<b>%{x}</b> FY26 PE: %{y:.1f}%<extra></extra>",
                },
              ]}
              layout={plotLayout({
                barmode: "group",
                height: 300,
                margin: { ...base.margin, t: 20 },
                yaxis: { ...base.yaxis, title: { text: "Growth (%)" } },
              })}
              config={defaultConfig}
              useResizeHandler style={{ width: "100%" }}
            />
          </ChartCard>

            <ChartCard
            title="Broad Sector GVA Growth"
            subtitle={`Primary / Secondary / Tertiary at ${pLabel(pBroad)}, FY23-24 to FY25-26 PE`}
            source="MoSPI NAS" sourceUrl={SOURCE_URL}
            toggle={<PriceToggle value={pBroad} onChange={setPBroad} />}
          >
            <Plot
              data={broad(pBroad).map((row) => ({
                type: "bar" as const,
                name: row.sector,
                x: ["FY23-24", "FY24-25 (FRE)", "FY25-26 (PE)"],
                y: [row.fy24, row.fy25, row.fy26],
                marker: { color: row.color },
                hovertemplate: `<b>${row.sector}</b> %{x}: %{y:.1f}%<extra></extra>`,
              }))}
              layout={plotLayout({
                barmode: "group",
                height: 300,
                margin: { ...base.margin, t: 20 },
                yaxis: { ...base.yaxis, title: { text: "Growth (%)" } },
              })}
              config={defaultConfig}
              useResizeHandler style={{ width: "100%" }}
            />
          </ChartCard>
        </div>

        {/* Row 5: GVA composition donut + broad sector note */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ChartCard
            title="Nominal GVA Composition, FY2025-26"
            subtitle="Share of sectors in total GVA at current prices · Statement 4"
            source="MoSPI NAS" sourceUrl={SOURCE_URL}
          >
            <Plot
              data={[{
                type: "pie",
                hole: 0.55,
                labels: ["Agriculture & Fish", "Mining & Quar.", "Manufacturing", "Electricity & Util.", "Construction", "Trade & Hotels", "Finance & RE", "Public Admin"],
                values: [18, 2, 15, 3, 8, 14, 27, 13],
                marker: { colors: Object.values(SC) },
                textinfo: "label+percent",
                textfont: { size: 11 },
                hovertemplate: "<b>%{label}</b><br>%{value}% of GVA<extra></extra>",
              }]}
              layout={plotLayout({
                height: 320,
                showlegend: false,
                margin: { l: 20, r: 20, t: 20, b: 20 },
              })}
              config={defaultConfig}
              useResizeHandler style={{ width: "100%" }}
            />
          </ChartCard>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Sector Color Key</h3>
            <div className="grid grid-cols-1 gap-2">
              {(Object.keys(SC) as (keyof typeof SC)[]).map((k) => (
                <div key={k} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: SC[k] }} />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-32">{SECTOR_LABELS[k]}</span>
                  <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>FY26 ann (R): <strong className="text-gray-700 dark:text-gray-200">{SECTOR_ANNUAL_REAL[k].fy26}%</strong></span>
                    <span>FY26 ann (N): <strong className="text-gray-700 dark:text-gray-200">{SECTOR_ANNUAL_NOM[k].fy26}%</strong></span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
              Same colors used across all sector charts above.
              Source:{" "}
              <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">
                MoSPI NAS
              </a>{" "}· Statements 3 and 6
            </p>
          </div>
        </div>

        {/* Indicators table */}
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
                <button key={key} onClick={() => setActiveCat(key)}
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
                  {[
                    { label: "Indicator", col: 0 as const },
                    { label: "Q4 FY26 (%)", col: 1 as const },
                    { label: "Annual FY26 (%)", col: 2 as const },
                  ].map(({ label, col }) => (
                    <th key={col}
                      onClick={() => { setSortCol(col); setSortAsc(sortCol === col ? !sortAsc : false); }}
                      className={`py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 whitespace-nowrap ${col === 0 ? "text-left" : "text-center"}`}
                    >
                      {label} <span className="opacity-40">↕</span>
                    </th>
                  ))}
                  <th className="py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center whitespace-nowrap">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row) => {
                  const m = CAT_META[row.cat];
                  const maxVal = Math.max(Math.abs(row.q4 ?? 0), Math.abs(row.ann ?? 0), 10);
                  return (
                    <tr key={row.name}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-orange-50/40 dark:hover:bg-orange-900/10">
                      <td className="py-2 px-3 text-gray-800 dark:text-gray-200 font-medium">
                        {row.name}{" "}
                        <span className="ml-1.5 text-xs font-bold px-1.5 py-0.5 rounded-full"
                          style={{ color: m.color, backgroundColor: m.color + "20" }}>
                          {m.label}
                        </span>
                      </td>
                      <td className={`py-1.5 px-3 text-center font-bold text-sm rounded ${cellClass(row.q4)}`}>
                        {fmt(row.q4)}
                      </td>
                      <td className={`py-1.5 px-3 text-center font-bold text-sm rounded ${cellClass(row.ann)}`}>
                        {fmt(row.ann)}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex flex-col gap-1 min-w-[52px]">
                          {[{ v: row.q4, label: "Q4" }, { v: row.ann, label: "Ann" }].map(({ v, label: lbl }) => (
                            <div key={lbl} className="flex items-center gap-1">
                              <div className="h-1.5 rounded-sm"
                                style={{
                                  width: `${Math.abs(v ?? 0) / maxVal * 44}px`,
                                  background: (v ?? 0) < 0 ? "#ef4444" : "#ea580c",
                                  opacity: lbl === "Ann" ? 0.5 : 1,
                                }} />
                              <span className="text-xs text-gray-400">{lbl}</span>
                            </div>
                          ))}
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
            <span className="bg-green-200 text-green-900 px-1.5 py-0.5 rounded text-xs">strong (&gt;10%)</span>{" "}
            <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded text-xs ml-1">moderate (3-10%)</span>{" "}
            <span className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded text-xs ml-1">weak (0-3%)</span>{" "}
            <span className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded text-xs ml-1">negative</span>
          </p>
        </div>

        {/* Methodology notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-800">
            <h3 className="text-sm font-semibold text-orange-900 dark:text-orange-200">About this release</h3>
            <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
              Provisional Estimates released 5 June 2026, incorporating full Q4 (Jan-Mar 2026) data.
              First comprehensive annual estimate for FY2025-26. Base year: <strong>2022-23</strong>
              (new series, introduced Feb 2026). Next revision: FRE expected January 2027.
            </p>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200">Methodology</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Compiled using benchmark-indicator method following IMF QNA Manual 2017.
              Q4 incorporates Advance Crop Estimates, commercial vehicle sales, air/rail traffic,
              and PFMS Central Govt data. Comprehensive Sources and Methods due August 2026.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
