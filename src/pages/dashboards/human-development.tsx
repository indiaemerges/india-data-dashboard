import Head from "next/head";
import { useWorldBankIndicators } from "@/lib/hooks/useWorldBank";
import { WORLD_BANK_INDICATORS } from "@/lib/api/worldbank";
import type { DataSeries } from "@/lib/api/types";
import LineChart from "@/components/charts/LineChart";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorDisplay from "@/components/ui/ErrorDisplay";

// ── Indicator list ────────────────────────────────────────────────────────────

const HD_INDICATORS = [
  // Health
  WORLD_BANK_INDICATORS.LIFE_EXPECTANCY,
  WORLD_BANK_INDICATORS.INFANT_MORTALITY,
  WORLD_BANK_INDICATORS.CHILD_MORTALITY_U5,
  WORLD_BANK_INDICATORS.MATERNAL_MORTALITY,
  WORLD_BANK_INDICATORS.IMMUNIZATION_MEASLES,
  WORLD_BANK_INDICATORS.IMMUNIZATION_DPT,
  // Education
  WORLD_BANK_INDICATORS.LITERACY_RATE_ADULT,
  WORLD_BANK_INDICATORS.LITERACY_RATE_MALE,
  WORLD_BANK_INDICATORS.LITERACY_RATE_FEMALE,
  WORLD_BANK_INDICATORS.ENROLLMENT_PRIMARY,
  WORLD_BANK_INDICATORS.ENROLLMENT_SECONDARY,
  WORLD_BANK_INDICATORS.ENROLLMENT_TERTIARY,
  WORLD_BANK_INDICATORS.GPI_PRIMARY_SECONDARY,
  // Gender
  WORLD_BANK_INDICATORS.MALE_LFPR,
  WORLD_BANK_INDICATORS.FEMALE_LFPR,
  // Poverty & Inequality
  WORLD_BANK_INDICATORS.POVERTY_RATIO,
  WORLD_BANK_INDICATORS.GINI_INDEX,
];

const SOURCE_LABEL = "World Bank WDI";
const SOURCE_URL = "https://data.worldbank.org/country/india";

// ── Helpers ───────────────────────────────────────────────────────────────────

function get(series: DataSeries[], id: string): DataSeries | undefined {
  return series.find((s) => s.indicatorId === id);
}

/** Get the most recent non-null value from a series */
function latest(s: DataSeries | undefined): number | null {
  if (!s) return null;
  const valid = s.data.filter((d) => d.value !== null);
  return valid.length > 0 ? valid[valid.length - 1].value : null;
}

/** Get the year of the most recent non-null value */
function latestYear(s: DataSeries | undefined): string {
  if (!s) return "";
  const valid = s.data.filter((d) => d.value !== null);
  return valid.length > 0 ? valid[valid.length - 1].date : "";
}

function fmt(v: number | null, decimals = 1): string {
  if (v === null) return "—";
  return v.toFixed(decimals);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  unit,
  year,
  color = "orange",
}: {
  label: string;
  value: string;
  unit: string;
  year: string;
  color?: "orange" | "blue" | "green" | "purple";
}) {
  const accent: Record<string, string> = {
    orange: "border-orange-400",
    blue: "border-blue-400",
    green: "border-green-400",
    purple: "border-purple-400",
  };
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl border-l-4 ${accent[color]} border border-gray-200 dark:border-gray-700 p-4`}
    >
      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">
        {label}
      </p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          {value}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">{unit}</span>
      </div>
      {year && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{year}</p>
      )}
    </div>
  );
}

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

function SparsityNote() {
  return (
    <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
      ⚠ Poverty and inequality surveys are conducted infrequently — India data
      available for select years only.
    </p>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function HumanDevelopmentDashboard() {
  const { data: wbSeries, isLoading, error, refetch } = useWorldBankIndicators(
    HD_INDICATORS,
    { years: 50 }
  );

  if (isLoading) {
    return <LoadingSpinner message="Fetching human development data..." />;
  }

  if (error || !wbSeries || wbSeries.length === 0) {
    return (
      <ErrorDisplay
        message={
          error instanceof Error
            ? error.message
            : "Failed to fetch human development data from World Bank"
        }
        onRetry={() => refetch()}
      />
    );
  }

  // ── Extract individual series ──────────────────────────────────────────────
  const WB = WORLD_BANK_INDICATORS;

  // Health
  const lifeExp        = get(wbSeries, WB.LIFE_EXPECTANCY);
  const infantMort     = get(wbSeries, WB.INFANT_MORTALITY);
  const u5Mort         = get(wbSeries, WB.CHILD_MORTALITY_U5);
  const maternalMort   = get(wbSeries, WB.MATERNAL_MORTALITY);
  const measlesImm     = get(wbSeries, WB.IMMUNIZATION_MEASLES);
  const dptImm         = get(wbSeries, WB.IMMUNIZATION_DPT);

  // Education
  const literacyAdult  = get(wbSeries, WB.LITERACY_RATE_ADULT);
  const literacyMale   = get(wbSeries, WB.LITERACY_RATE_MALE);
  const literacyFemale = get(wbSeries, WB.LITERACY_RATE_FEMALE);
  const enrollPrimary  = get(wbSeries, WB.ENROLLMENT_PRIMARY);
  const enrollSecondary= get(wbSeries, WB.ENROLLMENT_SECONDARY);
  const enrollTertiary = get(wbSeries, WB.ENROLLMENT_TERTIARY);
  const gpi            = get(wbSeries, WB.GPI_PRIMARY_SECONDARY);

  // Gender
  const maleLfpr       = get(wbSeries, WB.MALE_LFPR);
  const femaleLfpr     = get(wbSeries, WB.FEMALE_LFPR);

  // Poverty
  const poverty        = get(wbSeries, WB.POVERTY_RATIO);
  const gini           = get(wbSeries, WB.GINI_INDEX);

  // ── Rename series labels for charts ───────────────────────────────────────
  function renamed(s: DataSeries | undefined, label: string): DataSeries | undefined {
    if (!s) return undefined;
    return { ...s, indicator: label };
  }

  const lifeExpR        = renamed(lifeExp,        "Life Expectancy");
  const infantMortR     = renamed(infantMort,      "Infant Mortality");
  const u5MortR         = renamed(u5Mort,          "Under-5 Mortality");
  const maternalMortR   = renamed(maternalMort,    "Maternal Mortality");
  const measlesImmR     = renamed(measlesImm,      "Measles Vaccination");
  const dptImmR         = renamed(dptImm,          "DPT Vaccination");
  const litAdultR       = renamed(literacyAdult,   "Adult Literacy (Total)");
  const litMaleR        = renamed(literacyMale,    "Adult Literacy (Male)");
  const litFemaleR      = renamed(literacyFemale,  "Adult Literacy (Female)");
  const enrollPrimR     = renamed(enrollPrimary,   "Primary");
  const enrollSecR      = renamed(enrollSecondary, "Secondary");
  const enrollTerR      = renamed(enrollTertiary,  "Tertiary");
  const gpiR            = renamed(gpi,             "Gender Parity Index (Primary+Secondary)");
  const maleLfprR       = renamed(maleLfpr,        "Male LFPR");
  const femaleLfprR     = renamed(femaleLfpr,      "Female LFPR");
  const povertyR        = renamed(poverty,         "Poverty Headcount ($2.15/day)");
  const giniR           = renamed(gini,            "Gini Index");

  function seriesOf(...items: (DataSeries | undefined)[]): DataSeries[] {
    return items.filter((s): s is DataSeries => s !== undefined);
  }

  return (
    <>
      <Head>
        <title>Human Development · India Data Hub</title>
        <meta
          name="description"
          content="Education, health, gender equality, and poverty indicators for India from World Bank WDI"
        />
      </Head>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* ── Page header ── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Human Development
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Education · Health · Gender · Poverty &amp; Inequality ·{" "}
            <a
              href={SOURCE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:underline"
            >
              World Bank WDI
            </a>
          </p>
        </div>

        {/* ── Summary cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SummaryCard
            label="Life Expectancy"
            value={fmt(latest(lifeExp))}
            unit="years"
            year={latestYear(lifeExp)}
            color="green"
          />
          <SummaryCard
            label="Infant Mortality"
            value={fmt(latest(infantMort))}
            unit="per 1,000"
            year={latestYear(infantMort)}
            color="blue"
          />
          <SummaryCard
            label="Adult Literacy Rate"
            value={fmt(latest(literacyAdult))}
            unit="%"
            year={latestYear(literacyAdult)}
            color="orange"
          />
          <SummaryCard
            label="Female LFPR"
            value={fmt(latest(femaleLfpr))}
            unit="%"
            year={latestYear(femaleLfpr)}
            color="purple"
          />
        </div>

        {/* ── Section 1: Health ── */}
        <section>
          <SectionHeader
            title="Health"
            desc="Life expectancy, child and maternal mortality, and vaccination coverage"
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LineChart
              series={seriesOf(lifeExpR)}
              title="Life Expectancy at Birth"
              subtitle="Total population, years"
              source={SOURCE_LABEL}
              sourceUrl={SOURCE_URL}
              yAxisTitle="Years"
            />
            <LineChart
              series={seriesOf(infantMortR, u5MortR)}
              title="Child Mortality"
              subtitle="Infant (per 1,000 live births) and under-5 mortality rate"
              source={SOURCE_LABEL}
              sourceUrl={SOURCE_URL}
              yAxisTitle="per 1,000 live births"
            />
            <LineChart
              series={seriesOf(maternalMortR)}
              title="Maternal Mortality Ratio"
              subtitle="Modelled estimate, per 100,000 live births"
              source={SOURCE_LABEL}
              sourceUrl={SOURCE_URL}
              yAxisTitle="per 100,000 live births"
            />
            <LineChart
              series={seriesOf(measlesImmR, dptImmR)}
              title="Vaccination Coverage"
              subtitle="Measles and DPT immunisation (% of children aged 12–23 months)"
              source={SOURCE_LABEL}
              sourceUrl={SOURCE_URL}
              yAxisTitle="%"
            />
          </div>
        </section>

        {/* ── Section 2: Education ── */}
        <section>
          <SectionHeader
            title="Education"
            desc="Literacy rates, school enrolment by level, and gender parity"
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LineChart
              series={seriesOf(litAdultR, litMaleR, litFemaleR)}
              title="Adult Literacy Rate"
              subtitle="% of population aged 15+, by gender"
              source={SOURCE_LABEL}
              sourceUrl={SOURCE_URL}
              yAxisTitle="%"
            />
            <LineChart
              series={seriesOf(enrollPrimR, enrollSecR, enrollTerR)}
              title="Gross School Enrolment"
              subtitle="Primary, secondary, and tertiary enrolment ratios (%)"
              source={SOURCE_LABEL}
              sourceUrl={SOURCE_URL}
              yAxisTitle="%"
            />
          </div>
        </section>

        {/* ── Section 3: Gender ── */}
        <section>
          <SectionHeader
            title="Gender Equality"
            desc="Labour force participation and education gender parity"
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LineChart
              series={seriesOf(maleLfprR, femaleLfprR)}
              title="Labour Force Participation Rate"
              subtitle="Male and female LFPR (% of respective population aged 15+)"
              source={SOURCE_LABEL}
              sourceUrl={SOURCE_URL}
              yAxisTitle="%"
            />
            <LineChart
              series={seriesOf(gpiR)}
              title="Gender Parity Index"
              subtitle="Ratio of female to male gross enrolment (primary + secondary). 1.0 = parity"
              source={SOURCE_LABEL}
              sourceUrl={SOURCE_URL}
              yAxisTitle="GPI"
            />
          </div>
        </section>

        {/* ── Section 4: Poverty & Inequality ── */}
        <section>
          <SectionHeader
            title="Poverty &amp; Inequality"
            desc="Poverty headcount and income distribution"
          />
          <SparsityNote />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <LineChart
              series={seriesOf(povertyR)}
              title="Poverty Headcount Ratio"
              subtitle="Population below $2.15/day (2017 PPP), % of total"
              source={SOURCE_LABEL}
              sourceUrl={SOURCE_URL}
              yAxisTitle="%"
            />
            <LineChart
              series={seriesOf(giniR)}
              title="Gini Index"
              subtitle="Income inequality — 0 = perfect equality, 100 = perfect inequality"
              source={SOURCE_LABEL}
              sourceUrl={SOURCE_URL}
              yAxisTitle="Gini coefficient"
            />
          </div>
        </section>

        <p className="text-xs text-gray-400 dark:text-gray-500 pb-4">
          Source: World Bank World Development Indicators (WDI). Data for India.
          Some indicators updated with a 1–3 year lag; poverty and Gini
          estimates available only for survey years.
        </p>
      </div>
    </>
  );
}
