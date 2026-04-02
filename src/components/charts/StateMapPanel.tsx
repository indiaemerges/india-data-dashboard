import { useState, useId } from "react";
import ChoroplethMap from "@/components/charts/ChoroplethMap";
import {
  usePLFSStateData,
  useCPIStateData,
  useGSDPStateData,
  useAgriStateData,
  useEnergyStateData,
  useASIStateData,
  plfsStateSlice,
  gsdpStateSlice,
  agriStateSlice,
  energyStateSlice,
  asiStateSlice,
} from "@/lib/hooks/useMospiState";

// ── Colormap catalogue ─────────────────────────────────────────────────────────

const COLORMAPS = [
  { id: "YlOrRd",  label: "Yellow → Red" },
  { id: "Greens",  label: "Greens"       },
  { id: "Blues",   label: "Blues"        },
  { id: "Oranges", label: "Oranges"      },
  { id: "Viridis", label: "Viridis"      },
  { id: "RdBu",    label: "Diverging"    },
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
  {
    id: "rice_yield",
    label: "Rice Yield",
    description: "Rice yield in kg per hectare · Punjab 4,000+ vs Jharkhand ~1,400 — productivity gap between green-revolution and rain-fed states",
    unit: "kg/ha",
    source: "MoAFW Directorate of Economics & Statistics",
    sourceUrl: "https://aps.dac.gov.in/APY/Public_Report1.aspx",
    defaultColormap: "Greens" as ColormapId,
    dataset: "agri" as const,
    field: "rice_yield_kgha" as const,
  },
  {
    id: "wheat_yield",
    label: "Wheat Yield",
    description: "Wheat yield in kg per hectare · Punjab/Haryana 5,000+ vs Bihar ~2,500 — north-west wheat belt productivity advantage",
    unit: "kg/ha",
    source: "MoAFW Directorate of Economics & Statistics",
    sourceUrl: "https://aps.dac.gov.in/APY/Public_Report1.aspx",
    defaultColormap: "YlOrRd" as ColormapId,
    dataset: "agri" as const,
    field: "wheat_yield_kgha" as const,
  },
  {
    id: "sugarcane_prod",
    label: "Sugarcane Production",
    description: "State-wise sugarcane production · Million Tonnes · UP + Maharashtra account for ~70% of India's sugar output",
    unit: "Mt",
    source: "MoAFW Directorate of Economics & Statistics",
    sourceUrl: "https://aps.dac.gov.in/APY/Public_Report1.aspx",
    defaultColormap: "Greens" as ColormapId,
    dataset: "agri" as const,
    field: "sugarcane_mt" as const,
  },
  {
    id: "irrigation_pct",
    label: "Irrigation Coverage",
    description: "Net irrigated area as % of net sown area · Punjab ~99% vs Jharkhand ~15% — water access divide mirrors yield gap",
    unit: "%",
    source: "MoAFW Land Use Statistics",
    sourceUrl: "https://desagri.gov.in/",
    defaultColormap: "Blues" as ColormapId,
    dataset: "agri" as const,
    field: "irrigation_pct" as const,
  },
  {
    id: "elec_kwh_pc",
    label: "Electricity Consumption",
    description: "Per capita electricity consumption in kWh/year · Dadra & NH is an industrial outlier; Punjab/Gujarat/Haryana lead among major states · Bihar lowest at ~330 kWh",
    unit: "kWh",
    source: "Central Electricity Authority (CEA)",
    sourceUrl: "https://cea.nic.in/",
    defaultColormap: "YlOrRd" as ColormapId,
    dataset: "energy" as const,
    field: "elec_kwh_pc" as const,
  },
  {
    id: "renewable_gw",
    label: "Renewable Energy Capacity",
    description: "Installed renewable energy capacity in GW (solar + wind + hydro + biomass) · Rajasthan leads the solar boom; Karnataka & Tamil Nadu add wind",
    unit: "GW",
    source: "Ministry of New & Renewable Energy (MNRE) / CEA",
    sourceUrl: "https://mnre.gov.in/",
    defaultColormap: "Greens" as ColormapId,
    dataset: "energy" as const,
    field: "renewable_gw" as const,
  },
  // ── ASI (Annual Survey of Industries) ──────────────────────────────────────
  {
    id: "asi_gva",
    label: "Manufacturing GVA",
    description: "Gross Value Added from registered manufacturing · ₹ Lakh Crore · NIC 2008 · ASI combined sector · Maharashtra, Gujarat & Tamil Nadu dominate",
    unit: "₹ L.Cr",
    source: "MoSPI Annual Survey of Industries",
    sourceUrl: "https://mospi.gov.in/annual-survey-industries",
    defaultColormap: "Oranges" as ColormapId,
    dataset: "asi" as const,
    field: "gva_lakh" as const,
  },
  {
    id: "asi_workers",
    label: "Factory Workers",
    description: "Total persons engaged in registered factories · includes workers, supervisors and managers · Tamil Nadu, Gujarat & Maharashtra are the largest employers",
    unit: "persons",
    source: "MoSPI Annual Survey of Industries",
    sourceUrl: "https://mospi.gov.in/annual-survey-industries",
    defaultColormap: "Blues" as ColormapId,
    dataset: "asi" as const,
    field: "persons_engaged" as const,
  },
  {
    id: "asi_female_pct",
    label: "Female Worker Share",
    description: "Share of directly employed female workers in total factory workforce · Tamil Nadu ~24% leads; most northern states under 5%",
    unit: "%",
    source: "MoSPI Annual Survey of Industries",
    sourceUrl: "https://mospi.gov.in/annual-survey-industries",
    defaultColormap: "Greens" as ColormapId,
    dataset: "asi" as const,
    field: "female_workers_pct" as const,
  },
  {
    id: "asi_wages",
    label: "Factory Wages Paid",
    description: "Total wages & salaries including employer's contribution · ₹ Lakh Crore · proxy for manufacturing income concentrated in industrial states",
    unit: "₹ L.Cr",
    source: "MoSPI Annual Survey of Industries",
    sourceUrl: "https://mospi.gov.in/annual-survey-industries",
    defaultColormap: "YlOrRd" as ColormapId,
    dataset: "asi" as const,
    field: "wages_lakh" as const,
  },
  {
    id: "asi_factories",
    label: "Factories in Operation",
    description: "Number of registered factories in operation · Tamil Nadu leads with 30,000+ factories; Bihar and NE states have the fewest",
    unit: "factories",
    source: "MoSPI Annual Survey of Industries",
    sourceUrl: "https://mospi.gov.in/annual-survey-industries",
    defaultColormap: "Viridis" as ColormapId,
    dataset: "asi" as const,
    field: "factories_in_op" as const,
  },
] as const;

export type IndicatorId = (typeof INDICATORS)[number]["id"];

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

// ── Component ──────────────────────────────────────────────────────────────────

interface Props {
  indicators: IndicatorId[];
}

export default function StateMapPanel({ indicators }: Props) {
  const uid = useId();
  const selectId = `${uid}-indicator`;

  const allowed = INDICATORS.filter((ind) => indicators.includes(ind.id));

  const [indicatorId, setIndicatorId] = useState<IndicatorId>(allowed[0].id);
  const [periodIdx, setPeriodIdx]     = useState<number | null>(null);
  const [colormap, setColormap]       = useState<string>(allowed[0].defaultColormap);

  // Load all datasets — React Query caches, so only fetches what isn't already loaded
  const { data: plfsData }   = usePLFSStateData();
  const { data: cpiData }    = useCPIStateData();
  const { data: gsdpData }   = useGSDPStateData();
  const { data: agriData }   = useAgriStateData();
  const { data: energyData } = useEnergyStateData();
  const { data: asiData }    = useASIStateData();

  const needed = new Set(allowed.map((i) => i.dataset));
  const isLoading =
    (needed.has("plfs")   && !plfsData)   ||
    (needed.has("cpi")    && !cpiData)    ||
    (needed.has("gsdp")   && !gsdpData)   ||
    (needed.has("agri")   && !agriData)   ||
    (needed.has("energy") && !energyData) ||
    (needed.has("asi")    && !asiData);

  const indicator = allowed.find((ind) => ind.id === indicatorId) ?? allowed[0];

  function handleIndicatorChange(id: IndicatorId) {
    const next = allowed.find((ind) => ind.id === id)!;
    setIndicatorId(id);
    setPeriodIdx(null);
    setColormap(next.defaultColormap);
  }

  // ── Periods ──────────────────────────────────────────────────────────────────
  const periods: string[] = isLoading ? [] :
    indicator.dataset === "plfs"   ? (plfsData?.years   ?? []) :
    indicator.dataset === "gsdp"   ? (gsdpData?.years   ?? []) :
    indicator.dataset === "agri"   ? (agriData?.years   ?? []) :
    indicator.dataset === "energy" ? (energyData?.years ?? []) :
    indicator.dataset === "asi"    ? (asiData?.years    ?? []) :
    (cpiData?.months.map(fmtMonth) ?? []);

  const resolvedPeriodIdx =
    periodIdx !== null && periodIdx < periods.length ? periodIdx : periods.length - 1;

  // ── Map data ─────────────────────────────────────────────────────────────────
  let mapStates: string[]          = [];
  let mapValues: (number | null)[] = [];
  let periodLabel                  = "";

  if (!isLoading) {
    if (indicator.dataset === "plfs" && plfsData) {
      const slice = plfsStateSlice(plfsData, resolvedPeriodIdx, indicator.field);
      mapStates   = slice.names;
      mapValues   = slice.values;
      periodLabel = plfsData.years[resolvedPeriodIdx];
    } else if (indicator.dataset === "gsdp" && gsdpData) {
      const field = indicator.field as "gsdp_real_cr" | "gsdp_nominal_cr" | "gsdp_growth";
      const slice = gsdpStateSlice(gsdpData, resolvedPeriodIdx, field);
      const scale = (field === "gsdp_real_cr" || field === "gsdp_nominal_cr") ? 1000 : 1;
      mapStates   = slice.names;
      mapValues   = slice.values.map((v) => (v !== null ? Math.round(v / scale) : null));
      periodLabel = gsdpData.years[resolvedPeriodIdx];
    } else if (indicator.dataset === "agri" && agriData) {
      const field = indicator.field as "rice_mt" | "wheat_mt" | "rice_yield_kgha" | "wheat_yield_kgha" | "sugarcane_mt" | "irrigation_pct";
      const slice = agriStateSlice(agriData, resolvedPeriodIdx, field);
      mapStates   = slice.names;
      mapValues   = slice.values;
      periodLabel = agriData.years[resolvedPeriodIdx];
    } else if (indicator.dataset === "energy" && energyData) {
      const field = indicator.field as "elec_kwh_pc" | "renewable_gw";
      const slice = energyStateSlice(energyData, resolvedPeriodIdx, field);
      mapStates   = slice.names;
      mapValues   = slice.values;
      periodLabel = energyData.years[resolvedPeriodIdx];
    } else if (indicator.dataset === "asi" && asiData) {
      const field = indicator.field as "factories_in_op" | "gva_lakh" | "persons_engaged" | "female_workers_pct" | "wages_lakh" | "fixed_capital_lakh";
      const slice = asiStateSlice(asiData, resolvedPeriodIdx, field);
      // Scale ₹ lakh → lakh crore for GVA and wages display
      const isMonetary = field === "gva_lakh" || field === "wages_lakh" || field === "fixed_capital_lakh";
      mapStates   = slice.names;
      mapValues   = isMonetary
        ? slice.values.map((v) => (v !== null ? Math.round(v / 100000) : null))
        : slice.values;
      periodLabel = asiData.years[resolvedPeriodIdx];
    } else if (indicator.dataset === "cpi" && cpiData) {
      mapStates   = cpiData.states.map((s) => s.geoName);
      mapValues   = cpiData.states.map((s) => s.inflation[resolvedPeriodIdx] ?? null);
      periodLabel = fmtMonth(cpiData.months[resolvedPeriodIdx] ?? cpiData.months.slice(-1)[0]);
    }
  }

  const { min: zmin, max: zmax } = dataRange(mapValues);

  return (
    <div className="space-y-4">
      {/* ── Section heading ── */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">State-level Distribution</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Choropleth map across all Indian states and UTs · select indicator, year, and colour scheme below
        </p>
      </div>

      {/* ── Controls ── */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-4 space-y-4">

        {/* Row 1 — Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <label
            htmlFor={selectId}
            className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider shrink-0 w-24"
          >
            Indicator
          </label>
          <select
            id={selectId}
            value={indicatorId}
            onChange={(e) => handleIndicatorChange(e.target.value as IndicatorId)}
            className="w-full sm:w-auto text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            {allowed.map((ind) => (
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
          {isLoading ? (
            <div className="h-7 bg-gray-100 dark:bg-gray-700 rounded animate-pulse w-64" />
          ) : (
            <div className="flex flex-wrap gap-2">
              {periods.map((p, i) => (
                <Chip key={p} label={p} active={i === resolvedPeriodIdx} onClick={() => setPeriodIdx(i)} />
              ))}
            </div>
          )}
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

      {/* ── Map ── */}
      {isLoading ? (
        <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
          <p className="text-sm text-gray-400">Loading state data…</p>
        </div>
      ) : (
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
      )}

      <p className="text-xs text-gray-400 dark:text-gray-500">
        Map boundaries are for reference only and do not imply any political assertion.
      </p>
    </div>
  );
}
