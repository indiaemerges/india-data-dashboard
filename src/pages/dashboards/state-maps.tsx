import Head from "next/head";
import { useState } from "react";
import ChoroplethMap from "@/components/charts/ChoroplethMap";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorDisplay from "@/components/ui/ErrorDisplay";
import {
  usePLFSStateData,
  useCPIStateData,
  plfsStateSlice,
  cpiStateLatest,
} from "@/lib/hooks/useMospiState";

const PLFS_SOURCE = "MoSPI PLFS";
const PLFS_URL = "https://www.mospi.gov.in/";
const CPI_SOURCE = "MoSPI CPI";
const CPI_URL = "https://www.mospi.gov.in/";

// ── Month label formatting ─────────────────────────────────────────────────────
function fmtMonth(yyyyMM: string): string {
  const [y, m] = yyyyMM.split("-");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[parseInt(m, 10) - 1]} ${y}`;
}

// ── Helper: compute min/max ignoring nulls, rounded to nice numbers ───────────
function dataRange(
  vals: (number | null)[]
): { min: number; max: number } {
  const valid = vals.filter((v): v is number => v !== null);
  if (valid.length === 0) return { min: 0, max: 10 };
  return { min: Math.floor(Math.min(...valid)), max: Math.ceil(Math.max(...valid)) };
}

// ── Small selector chip ────────────────────────────────────────────────────────
function YearChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
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
  const [yearIdx, setYearIdx] = useState<number | null>(null); // null = use latest

  const {
    data: plfsData,
    isLoading: plfsLoading,
    error: plfsError,
    refetch: plfsRefetch,
  } = usePLFSStateData();

  const {
    data: cpiData,
    isLoading: cpiLoading,
    error: cpiError,
    refetch: cpiRefetch,
  } = useCPIStateData();

  if (plfsLoading || cpiLoading) {
    return <LoadingSpinner message="Loading state-level data…" />;
  }

  if (plfsError || !plfsData) {
    return (
      <ErrorDisplay
        message={
          plfsError instanceof Error
            ? plfsError.message
            : "Failed to load PLFS state data"
        }
        onRetry={() => plfsRefetch()}
      />
    );
  }

  if (cpiError || !cpiData) {
    return (
      <ErrorDisplay
        message={
          cpiError instanceof Error
            ? cpiError.message
            : "Failed to load CPI state data"
        }
        onRetry={() => cpiRefetch()}
      />
    );
  }

  // ── Resolve selected year index ─────────────────────────────────────────────
  const resolvedYearIdx =
    yearIdx !== null ? yearIdx : plfsData.years.length - 1;
  const selectedYear = plfsData.years[resolvedYearIdx];

  // ── Extract data slices ─────────────────────────────────────────────────────
  const urSlice = plfsStateSlice(plfsData, resolvedYearIdx, "ur_person");
  const lfprSlice = plfsStateSlice(plfsData, resolvedYearIdx, "lfpr_female");
  const { names: cpiNames, values: cpiValues, monthLabel } =
    cpiStateLatest(cpiData);

  const urRange = dataRange(urSlice.values);
  const lfprRange = dataRange(lfprSlice.values);
  const cpiRange = dataRange(cpiValues);

  return (
    <>
      <Head>
        <title>State Maps · India Data Hub</title>
        <meta
          name="description"
          content="State-wise choropleth maps of unemployment, female labour force participation, and CPI inflation across India"
        />
      </Head>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* ── Page header ── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            State Maps
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            State-wise choropleth maps · Labour &amp; Prices ·{" "}
            <a
              href={PLFS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:underline"
            >
              MoSPI PLFS
            </a>{" "}
            &amp;{" "}
            <a
              href={CPI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:underline"
            >
              CPI
            </a>
          </p>
        </div>

        {/* ── Year selector (PLFS) ── */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2 uppercase tracking-wider">
            PLFS Year
          </p>
          <div className="flex flex-wrap gap-2">
            {plfsData.years.map((yr, i) => (
              <YearChip
                key={yr}
                label={yr}
                active={i === resolvedYearIdx}
                onClick={() => setYearIdx(i)}
              />
            ))}
          </div>
        </div>

        {/* ── PLFS maps ── */}
        <section>
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Labour Market · {selectedYear}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Combined (rural + urban), persons aged 15+, PS+SS basis
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChoroplethMap
              title="Unemployment Rate"
              subtitle={`${selectedYear} · % of labour force · All persons`}
              states={urSlice.names}
              values={urSlice.values}
              unit="%"
              colorscale="YlOrRd"
              zmin={urRange.min}
              zmax={urRange.max}
              source={PLFS_SOURCE}
              sourceUrl={PLFS_URL}
            />

            <ChoroplethMap
              title="Female Labour Force Participation"
              subtitle={`${selectedYear} · % of female population aged 15+`}
              states={lfprSlice.names}
              values={lfprSlice.values}
              unit="%"
              colorscale="YlGn"
              zmin={lfprRange.min}
              zmax={lfprRange.max}
              source={PLFS_SOURCE}
              sourceUrl={PLFS_URL}
            />
          </div>
        </section>

        {/* ── CPI map ── */}
        <section>
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Inflation · {fmtMonth(monthLabel)}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Headline CPI — General, combined (rural + urban), base year 2012=100
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChoroplethMap
              title="Headline CPI Inflation"
              subtitle={`${fmtMonth(monthLabel)} · YoY % change`}
              states={cpiNames}
              values={cpiValues}
              unit="%"
              colorscale="YlOrRd"
              zmin={cpiRange.min}
              zmax={cpiRange.max}
              source={CPI_SOURCE}
              sourceUrl={CPI_URL}
            />

            {/* Placeholder / gap — can add a 4th map here later */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center min-h-[480px]">
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center px-6">
                More state-level indicators coming soon<br />
                <span className="text-xs">(Literacy · Sex Ratio · ASI output per state)</span>
              </p>
            </div>
          </div>
        </section>

        <p className="text-xs text-gray-400 dark:text-gray-500 pb-4">
          Sources: MoSPI Periodic Labour Force Survey (PLFS) and Consumer Price
          Index (CPI) state-level data. Map boundaries are for reference only.
        </p>
      </div>
    </>
  );
}
