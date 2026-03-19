import Head from "next/head";
import { useState } from "react";
import ChoroplethMap from "@/components/charts/ChoroplethMap";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorDisplay from "@/components/ui/ErrorDisplay";
import {
  usePLFSStateData,
  useCPIStateData,
  useGSDPStateData,
  useAgriStateData,
  plfsStateSlice,
  gsdpStateSlice,
  agriStateSlice,
} from "@/lib/hooks/useMospiState";

// ── Colormap catalogue ─────────────────────────────────────────────────────────

const COLORMAPS = [
  { id: "YlOrRd",  label: "Yellow → Red"   },
  { id: "Greens",  label: "Greens"         },
  { id: "Blues",   label: "Blues"          },
  { id: "Oranges", label: "Oranges"        },
  { id: "Viridis", label: "Viridis"        },
  { id: "RdBu",    label: "Diverging"      },
] as const;
type ColormapId = (typeof COLORMAPS)[number]["id"];

// ── Indicator catalogue ────────────────────────────────────────────────────────

const INDICATORS = [
  {
    id: "ur_person",
    label: "Unemployment Rate",
    description: "% of labour force · all persons · combined (rural + urban) · age 15+ · PS+SS",
    unit: "%",
    source: "MoSPI PLFS",
    sourceUrl: "https://www.mospi.gov.in/",
    defaultColormap: "YlOrRd" as ColormapId,
    dataset: "plfs" as const,
    field: "ur_person" as const,
  },
  {
    id: "lfpr_person",
    label: "LFPR (Total)",
    description: "Total labour force participation rate · all persons · combined (rural + urban) · age 15+ · PS+SS",
    unit: "%",
    source: "MoSPI PLFS",
    sourceUrl: "https://www.mospi.gov.in/",
    defaultColormap: "Blues" as ColormapId,
    dataset: "plfs" as const,
    field: "lfpr_person" as const,
  },
  {
    id: "lfpr_female",
    label: "Female LFPR",
    description: "Female labour force participation · % of female population aged 15+ · combined",
    unit: "%",
    source: "MoSPI PLFS",
    sourceUrl: "https://www.mospi.gov.in/",
    defaultColormap: "Greens" as ColormapId,
    dataset: "plfs" as const,
    field: "lfpr_female" as const,
  },
  {
    id: "lfpr_male",
    label: "Male LFPR",
    description: "Male labour force participation rate · % of male population aged 15+ · combined",
    unit: "%",
    source: "MoSPI PLFS",
    sourceUrl: "https://www.mospi.gov.in/",
    defaultColormap: "Oranges" as ColormapId,
    dataset: "plfs" as const,
    field: "lfpr_male" as const,
  },
  {
    id: "cpi_general",
    label: "CPI Inflation",
    description: "Headline CPI (General) · YoY % change · combined (rural + urban) · base year 2012=100",
    unit: "%",
    source: "MoSPI CPI",
    sourceUrl: "https://www.mospi.gov.in/",
    defaultColormap: "YlOrRd" as ColormapId,
    dataset: "cpi" as const,
    field: "inflation" as const,
  },
  {
    id: "gsdp_growth",
    label: "GSDP Growth Rate",
    description: "Real GSDP growth · YoY % · constant 2011-12 prices · RBI Handbook of Statistics",
    unit: "%",
    source: "RBI Handbook of Statistics on Indian States",
    sourceUrl: "https://www.rbi.org.in/Scripts/AnnualPublications.aspx?head=Handbook+of+Statistics+on+Indian+States",
    defaultColormap: "RdBu" as ColormapId,
    dataset: "gsdp" as const,
    field: "gsdp_growth" as const,
  },
  {
    id: "gsdp_real",
    label: "GSDP (Real)",
    description: "Gross State Domestic Product at constant 2011-12 prices · ₹ '000 Crore",
    unit: "₹ '000 Cr",
    source: "RBI Handbook of Statistics on Indian States",
    sourceUrl: "https://www.rbi.org.in/Scripts/AnnualPublications.aspx?head=Handbook+of+Statistics+on+Indian+States",
    defaultColormap: "Blues" as ColormapId,
    dataset: "gsdp" as const,
    field: "gsdp_real_cr" as const,
  },
  {
    id: "gsdp_nominal",
    label: "GSDP (Nominal)",
    description: "Gross State Domestic Product at current prices · ₹ '000 Crore",
    unit: "₹ '000 Cr",
    source: "RBI Handbook of Statistics on Indian States",
    sourceUrl: "https://www.rbi.org.in/Scripts/AnnualPublications.aspx?head=Handbook+of+Statistics+on+Indian+States",
    defaultColormap: "Oranges" as ColormapId,
    dataset: "gsdp" as const,
    field: "gsdp_nominal_cr" as const,
  },
  {
    id: "rice_prod",
    label: "Rice Production",
    description: "State-wise rice production · Kharif + Rabi paddy converted to rice · Million Tonnes · MoAFW DES",
    unit: "Mt",
    source: "MoAFW Directorate of Economics & Statistics",
    sourceUrl: "https://aps.dac.gov.in/APY/Public_Report1.aspx",
    defaultColormap: "Greens" as ColormapId,
    dataset: "agri" as const,
    field: "rice_mt" as const,
  },
  {
    id: "wheat_prod",
    label: "Wheat Production",
    description: "State-wise wheat production · Rabi crop · Million Tonnes · MoAFW DES",
    unit: "Mt",
    source: "MoAFW Directorate of Economics & Statistics",
    sourceUrl: "https://aps.dac.gov.in/APY/Public_Report1.aspx",
    defaultColormap: "YlOrRd" as ColormapId,
    dataset: "agri" as const,
    field: "wheat_mt" as const,
  },
] as const;

type IndicatorId = (typeof INDICATORS)[number]["id"];

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtMonth(yyyyMM: string): string {
  const [y, m] = yyyyMM.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(m, 10) - 1]} ${y}`;
}

function dataRange(vals: (number | null)[]): { min: number; max: number } {
  const valid = vals.filter((v): v is number => v !== null);
  if (valid.length === 0) return { min: 0, max: 10 };
  return { min: Math.floor(Math.min(...valid)), max: Math.ceil(Math.max(...valid)) };
}

// ── Chip button ────────────────────────────────────────────────────────────────
function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
        active
          ? "bg-orange-500 text-white border-orange-500"
          : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-orange-400"
      }`}
    >
      {label}
    </button>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────

export default function StateMapsPage() {
  const [indicatorId, setIndicatorId] = useState<IndicatorId>("ur_person");
  const [periodIdx, setPeriodIdx]     = useState<number | null>(null);
  const [colormap, setColormap]       = useState<string>(INDICATORS[0].defaultColormap);

  const { data: plfsData, isLoading: plfsLoading, error: plfsError, refetch: plfsRefetch } =
    usePLFSStateData();
  const { data: cpiData, isLoading: cpiLoading, error: cpiError, refetch: cpiRefetch } =
    useCPIStateData();
  const { data: gsdpData, isLoading: gsdpLoading, error: gsdpError, refetch: gsdpRefetch } =
    useGSDPStateData();
  const { data: agriData, isLoading: agriLoading, error: agriError, refetch: agriRefetch } =
    useAgriStateData();

  if (plfsLoading || cpiLoading || gsdpLoading || agriLoading) {
    return <LoadingSpinner message="Loading state-level data…" />;
  }
  if (plfsError || !plfsData) {
    return (
      <ErrorDisplay
        message={plfsError instanceof Error ? plfsError.message : "Failed to load PLFS state data"}
        onRetry={() => plfsRefetch()}
      />
    );
  }
  if (cpiError || !cpiData) {
    return (
      <ErrorDisplay
        message={cpiError instanceof Error ? cpiError.message : "Failed to load CPI state data"}
        onRetry={() => cpiRefetch()}
      />
    );
  }
  if (gsdpError || !gsdpData) {
    return (
      <ErrorDisplay
        message={gsdpError instanceof Error ? gsdpError.message : "Failed to load GSDP state data"}
        onRetry={() => gsdpRefetch()}
      />
    );
  }
  if (agriError || !agriData) {
    return (
      <ErrorDisplay
        message={agriError instanceof Error ? agriError.message : "Failed to load agriculture state data"}
        onRetry={() => agriRefetch()}
      />
    );
  }

  // ── Active indicator ───────────────────────────────────────────────────────
  const indicator = INDICATORS.find((ind) => ind.id === indicatorId)!;

  // ── Period options ─────────────────────────────────────────────────────────
  const periods: string[] =
    indicator.dataset === "plfs" ? plfsData.years :
    indicator.dataset === "gsdp" ? gsdpData.years :
    indicator.dataset === "agri" ? agriData.years :
    cpiData.months.map(fmtMonth);

  const resolvedPeriodIdx =
    periodIdx !== null && periodIdx < periods.length ? periodIdx : periods.length - 1;

  // Reset period + colormap when switching indicators
  function handleIndicatorChange(id: IndicatorId) {
    const next = INDICATORS.find((ind) => ind.id === id)!;
    setIndicatorId(id);
    setPeriodIdx(null);
    setColormap(next.defaultColormap);
  }

  // ── Resolve map data ───────────────────────────────────────────────────────
  let mapStates: string[];
  let mapValues: (number | null)[];
  let periodLabel: string;

  if (indicator.dataset === "plfs") {
    const slice = plfsStateSlice(plfsData, resolvedPeriodIdx, indicator.field);
    mapStates   = slice.names;
    mapValues   = slice.values;
    periodLabel = plfsData.years[resolvedPeriodIdx];
  } else if (indicator.dataset === "gsdp") {
    const field = indicator.field as "gsdp_real_cr" | "gsdp_nominal_cr" | "gsdp_growth";
    const slice = gsdpStateSlice(gsdpData, resolvedPeriodIdx, field);
    mapStates   = slice.names;
    // Scale real/nominal GSDP from ₹ Crore → ₹ '000 Crore for readable annotations
    const scale = (field === "gsdp_real_cr" || field === "gsdp_nominal_cr") ? 1000 : 1;
    mapValues   = slice.values.map((v) => (v !== null ? Math.round(v / scale) : null));
    periodLabel = gsdpData.years[resolvedPeriodIdx];
  } else if (indicator.dataset === "agri") {
    const field = indicator.field as "rice_mt" | "wheat_mt";
    const slice = agriStateSlice(agriData, resolvedPeriodIdx, field);
    mapStates   = slice.names;
    mapValues   = slice.values;
    periodLabel = agriData.years[resolvedPeriodIdx];
  } else {
    mapStates   = cpiData.states.map((s) => s.geoName);
    mapValues   = cpiData.states.map((s) => s.inflation[resolvedPeriodIdx] ?? null);
    periodLabel = fmtMonth(cpiData.months[resolvedPeriodIdx] ?? cpiData.months.slice(-1)[0]);
  }

  const { min: zmin, max: zmax } = dataRange(mapValues);

  return (
    <>
      <Head>
        <title>State Maps · India Data Hub</title>
        <meta
          name="description"
          content="State-wise choropleth maps of unemployment, LFPR (total, male, female), CPI inflation, and GSDP across India"
        />
      </Head>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {/* ── Page header ── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">State Maps</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            State-wise indicators across all Indian states and UTs · MoSPI PLFS, CPI &amp; RBI GSDP
          </p>
        </div>

        {/* ── Controls panel ── */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-4 space-y-4">

          {/* Row 1 — Indicator dropdown */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label
              htmlFor="indicator-select"
              className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider shrink-0 w-24"
            >
              Indicator
            </label>
            <select
              id="indicator-select"
              value={indicatorId}
              onChange={(e) => handleIndicatorChange(e.target.value as IndicatorId)}
              className="w-full sm:w-auto text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              {INDICATORS.map((ind) => (
                <option key={ind.id} value={ind.id}>
                  {ind.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 dark:text-gray-500 sm:ml-2 hidden sm:block truncate">
              {indicator.description}
            </p>
          </div>

          {/* Row 2 — Period chips */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              {indicator.dataset === "cpi" ? "Month" : "Fiscal Year"}
            </p>
            <div className="flex flex-wrap gap-2">
              {periods.map((p, i) => (
                <Chip key={p} label={p} active={i === resolvedPeriodIdx} onClick={() => setPeriodIdx(i)} />
              ))}
            </div>
          </div>

          {/* Row 3 — Colormap chips */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Colormap
            </p>
            <div className="flex flex-wrap gap-2">
              {COLORMAPS.map((cm) => (
                <Chip
                  key={cm.id}
                  label={cm.label}
                  active={colormap === cm.id}
                  onClick={() => setColormap(cm.id)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Single choropleth map ── */}
        <ChoroplethMap
          title={`${indicator.label} · ${periodLabel}`}
          subtitle={indicator.description}
          states={mapStates}
          values={mapValues}
          unit={indicator.unit}
          colorscale={colormap}
          zmin={zmin}
          zmax={zmax}
          showAnnotations
          source={indicator.source}
          sourceUrl={indicator.sourceUrl}
          height={580}
        />

        <p className="text-xs text-gray-400 dark:text-gray-500 pb-4">
          Sources: MoSPI Periodic Labour Force Survey (PLFS), Consumer Price Index (CPI), RBI Handbook of Statistics on Indian States (GSDP), and MoAFW Directorate of Economics &amp; Statistics (Crop Production).
          Map boundaries are for reference only and do not imply any political assertion.
        </p>
      </div>
    </>
  );
}
