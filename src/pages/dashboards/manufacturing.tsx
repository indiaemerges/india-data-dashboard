import Head from "next/head";
import StateMapPanel from "@/components/charts/StateMapPanel";
import {
  useASIAnnualData,
  asiOutputSeries,
  asiCapitalSeries,
  asiWagesSeries,
  asiWorkersSeries,
  asiGenderWorkersSeries,
  asiProductivitySeries,
  asiWagePerWorkerSeries,
  asiFemaleShareSeries,
  asiNICSeries,
  asiLatestYearIndex,
} from "@/lib/hooks/useMospiASI";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorDisplay from "@/components/ui/ErrorDisplay";

const SOURCE_LABEL = "MoSPI, Annual Survey of Industries";
const SOURCE_URL = "https://mospi.gov.in/annual-survey-industries";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtLakhCr(lakhs: number, decimals = 1): string {
  // 1 lakh crore = 10^12 rupees = 10^7 lakhs → divide by 1,00,00,000
  return (lakhs / 1_00_00_000).toFixed(decimals);
}
function fmtCr(n: number): string {
  return (n / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}
function fmtCount(n: number): string {
  return n.toLocaleString("en-IN");
}
function fmtMillions(n: number, decimals = 2): string {
  return (n / 1_000_000).toFixed(decimals);
}

// ─── Summary card ─────────────────────────────────────────────────────────────

function Card({
  label,
  value,
  unit,
  sub,
  trend,
}: {
  label: string;
  value: string;
  unit: string;
  sub: string;
  trend?: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">
        {label}
      </p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          {value}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">{unit}</span>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{sub}</p>
      {trend && (
        <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5 font-medium">
          {trend}
        </p>
      )}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h2>
      {desc && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
      )}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function ManufacturingDashboard() {
  const { data, isLoading, error, refetch } = useASIAnnualData();

  if (isLoading) {
    return <LoadingSpinner message="Loading ASI manufacturing data..." />;
  }

  if (error || !data) {
    return (
      <ErrorDisplay
        message={
          error instanceof Error
            ? error.message
            : "Failed to load Annual Survey of Industries data"
        }
        onRetry={() => refetch()}
      />
    );
  }

  const latestIdx = asiLatestYearIndex(data);
  const latestYear = data.years[latestIdx];
  const prevIdx = latestIdx - 1;

  // Latest values
  const gvaLatest = data.totals.gva[latestIdx];
  const gvaPrev = data.totals.gva[prevIdx];
  const workersLatest = data.totals.workers[latestIdx];
  const factoriesLatest = data.totals.factories[latestIdx];
  const wagesLatest = data.totals.wages[latestIdx];
  const productivity = workersLatest > 0 ? gvaLatest / workersLatest : null;
  const gvaGrowth =
    gvaPrev > 0 ? (((gvaLatest - gvaPrev) / gvaPrev) * 100).toFixed(1) : null;

  // Chart series
  const outputSeries = asiOutputSeries(data);
  const capitalSeries = asiCapitalSeries(data);
  const wagesSeries = asiWagesSeries(data);
  const workersSeries = asiWorkersSeries(data);
  const genderSeries = asiGenderWorkersSeries(data);
  const productivitySeries = asiProductivitySeries(data);
  const wagePerWorkerSeries = asiWagePerWorkerSeries(data);
  const femaleShareSeries = asiFemaleShareSeries(data);
  const gvaBySector = asiNICSeries(data, latestIdx, "gva");
  const workersBySector = asiNICSeries(data, latestIdx, "workers");

  return (
    <>
      <Head>
        <title>Manufacturing & Industry (ASI) · India Data Hub</title>
        <meta
          name="description"
          content="Annual Survey of Industries: GVA, factories, workers, wages, and sector-level data from MoSPI"
        />
      </Head>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* ── Page header ── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Annual Survey of Industries
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            India&apos;s organised manufacturing sector · 2008-09 to {latestYear} ·{" "}
            <a
              href={SOURCE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:underline"
            >
              MoSPI ASI
            </a>
          </p>
        </div>

        {/* ── Summary cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card
            label={`Gross Value Added · ${latestYear}`}
            value={`₹${fmtLakhCr(gvaLatest)}`}
            unit="Lakh Crore"
            sub="At current prices"
            trend={gvaGrowth ? `+${gvaGrowth}% vs prior year` : undefined}
          />
          <Card
            label={`Factories in Operation · ${latestYear}`}
            value={fmtCount(factoriesLatest)}
            unit="factories"
            sub="Registered factory units"
          />
          <Card
            label={`Total Workers · ${latestYear}`}
            value={fmtMillions(workersLatest)}
            unit="Million"
            sub={`${fmtCr(workersLatest)} workers total`}
          />
          <Card
            label={`Labour Productivity · ${latestYear}`}
            value={productivity != null ? `₹${productivity.toFixed(1)}` : "—"}
            unit="Lakh/worker"
            sub="GVA per worker per year"
          />
        </div>

        {/* ── Section 1: Scale & Output ── */}
        <section>
          <SectionHeader
            title="Output & Capital"
            desc="GVA (value added), total output, and fixed capital — all at current prices"
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LineChart
              series={outputSeries}
              title="GVA and Total Output"
              subtitle="Gross Value Added vs Total Output (₹ Lakh Crore)"
              source={SOURCE_LABEL}
              sourceUrl={SOURCE_URL}
              yAxisTitle="₹ Lakh Crore"
            />
            <LineChart
              series={[capitalSeries, wagesSeries]}
              title="Fixed Capital & Total Wages"
              subtitle="Capital base and wage bill over time"
              source={SOURCE_LABEL}
              sourceUrl={SOURCE_URL}
              yAxisTitle="₹ Lakh Crore"
            />
          </div>
        </section>

        {/* ── Section 2: Employment ── */}
        <section>
          <SectionHeader
            title="Employment"
            desc="Workers, persons engaged (including management), and gender composition"
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LineChart
              series={workersSeries}
              title="Workers & Persons Engaged"
              subtitle="Total workforce in India's organised factories"
              source={SOURCE_LABEL}
              sourceUrl={SOURCE_URL}
              yAxisTitle="Millions"
            />
            <LineChart
              series={genderSeries}
              title="Male and Female Workers"
              subtitle="Directly employed workers by gender"
              source={SOURCE_LABEL}
              sourceUrl={SOURCE_URL}
              yAxisTitle="Millions"
            />
          </div>
        </section>

        {/* ── Section 3: Productivity & Wages ── */}
        <section>
          <SectionHeader
            title="Productivity & Wages"
            desc="Derived metrics: output per worker, wages per worker, and female workforce participation"
          />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <LineChart
              series={[productivitySeries]}
              title="Labour Productivity"
              subtitle="GVA per worker (₹ Lakh/year)"
              source={SOURCE_LABEL}
              sourceUrl={SOURCE_URL}
              yAxisTitle="₹ Lakh per worker"
            />
            <LineChart
              series={[wagePerWorkerSeries]}
              title="Average Wages per Worker"
              subtitle="Total wages ÷ total workers (₹ Lakh/year)"
              source={SOURCE_LABEL}
              sourceUrl={SOURCE_URL}
              yAxisTitle="₹ Lakh per worker"
            />
            <LineChart
              series={[femaleShareSeries]}
              title="Female Worker Share"
              subtitle="Female % of directly employed workers"
              source={SOURCE_LABEL}
              sourceUrl={SOURCE_URL}
              yAxisTitle="%"
            />
          </div>
        </section>

        {/* ── Section 4: Sector Breakdown ── */}
        <section>
          <SectionHeader
            title={`Sector Breakdown · ${latestYear}`}
            desc="Top manufacturing sectors by GVA and employment (NIC 2008 2-digit, manufacturing only)"
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <BarChart
              series={[gvaBySector]}
              title="GVA by Manufacturing Sector"
              subtitle={`₹ Lakh Crore · ${latestYear}`}
              source={SOURCE_LABEL}
              sourceUrl={SOURCE_URL}
              orientation="h"
              height={480}
            />
            <BarChart
              series={[workersBySector]}
              title="Workers by Manufacturing Sector"
              subtitle={`Number of workers · ${latestYear}`}
              source={SOURCE_LABEL}
              sourceUrl={SOURCE_URL}
              orientation="h"
              height={480}
            />
          </div>
        </section>

        {/* ── State Distribution Maps ── */}
        <StateMapPanel indicators={["asi_gva", "asi_workers", "asi_female_pct", "asi_wages", "asi_factories"]} />

        {/* ── Data note ── */}
        <p className="text-xs text-gray-400 dark:text-gray-500 pb-4">
          Source: MoSPI Annual Survey of Industries, NIC 2008 classification, Combined
          sector. Financial values at current prices in ₹ lakhs. Workers = directly
          employed + contract workers. Sector breakdown covers manufacturing NIC 10–33.
        </p>
      </div>
    </>
  );
}
