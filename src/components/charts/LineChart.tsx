import PlotlyChart from "./PlotlyChart";
import type { DataSeries } from "@/lib/api/types";

interface LineChartProps {
  series: DataSeries[];
  title?: string;
  subtitle?: string;
  source?: string;
  sourceUrl?: string;
  showMarkers?: boolean;
  yAxisTitle?: string;
  height?: number;
  /** Plotly line shape. Use "hv" for step charts (policy rates). Default: "linear" */
  lineShape?: "linear" | "spline" | "hv" | "vh" | "hvh" | "vhv";
}

/**
 * Detect whether series have different units and need dual y-axes.
 * Returns the set of unique units found.
 */
function getUniqueUnits(series: DataSeries[]): string[] {
  const seen = new Set<string>();
  for (const s of series) {
    seen.add(s.unit);
  }
  return [...seen];
}

export default function LineChart({
  series,
  title,
  subtitle,
  source,
  sourceUrl,
  showMarkers = true,
  yAxisTitle,
  height = 400,
  lineShape = "linear",
}: LineChartProps) {
  const uniqueUnits = getUniqueUnits(series);
  const useDualAxis = uniqueUnits.length === 2 && !yAxisTitle;

  // Map each unit to its axis: first unique unit → y, second → y2
  const unitToAxis: Record<string, string> = {};
  if (useDualAxis) {
    unitToAxis[uniqueUnits[0]] = "y";
    unitToAxis[uniqueUnits[1]] = "y2";
  }

  // ── Axis type detection ────────────────────────────────────────────────
  // Check if the first non-empty series has quarterly labels "YYYY-YY Qn"
  const firstSeriesDates =
    series.length > 0 ? series[0].data.map((d) => d.date) : [];
  const isQuarterly =
    firstSeriesDates.length > 0 &&
    /^\d{4}-\d{2} Q\d$/.test(firstSeriesDates[0]);

  // Detect Indian fiscal-year strings like "2008-09", "2017-18".
  //
  // The naive regex /^\d{4}-\d{2}$/ also matches monthly "YYYY-MM" strings
  // (e.g. "2012-04"), which would force type:'category' on monthly charts and
  // produce a tick for every single month.
  //
  // Primary rule: for Indian fiscal years the two-digit suffix equals
  //   (YYYY + 1) mod 100.  e.g. 2008-09 → (2008+1)%100 = 9 ✓
  //                             2012-04 → (2012+1)%100 = 13 ≠ 4 ✗
  //
  // Edge-case guard: years like 2000 produce suffix 01, which also matches
  // January ("2000-01"). If two consecutive entries share the same 4-digit
  // year prefix, the series is calendar-monthly, not annual fiscal.
  const isFiscalYear = (() => {
    if (firstSeriesDates.length === 0) return false;
    const m = firstSeriesDates[0].match(/^(\d{4})-(\d{2})$/);
    if (!m) return false;
    if (
      firstSeriesDates.length > 1 &&
      firstSeriesDates[0].slice(0, 4) === firstSeriesDates[1].slice(0, 4)
    ) {
      return false; // Same year on consecutive entries → calendar monthly
    }
    return parseInt(m[2], 10) === (parseInt(m[1], 10) + 1) % 100;
  })();

  // Detect calendar-monthly strings "YYYY-MM" that are NOT fiscal years.
  // For these we apply an explicit annual tick interval so the axis stays
  // readable regardless of how many months of data are loaded.
  const isCalendarMonthly =
    !isQuarterly &&
    !isFiscalYear &&
    firstSeriesDates.length > 0 &&
    /^\d{4}-\d{2}$/.test(firstSeriesDates[0]);

  // Detect "MMM YYYY" strings (e.g. "Mar 2014") — used by CPI and similar
  // monthly series. These are category labels; we thin to one tick per year
  // by keeping only "Jan YYYY" entries (or the earliest per year if Jan absent).
  const isMonthYear =
    !isQuarterly &&
    !isFiscalYear &&
    !isCalendarMonthly &&
    firstSeriesDates.length > 0 &&
    /^[A-Z][a-z]{2} \d{4}$/.test(firstSeriesDates[0]);

  // For "MMM YYYY" axes build annual tick arrays (index → label).
  const monthYearAnnualTicks: { vals: number[]; texts: string[] } = (() => {
    if (!isMonthYear) return { vals: [], texts: [] };
    const dates = firstSeriesDates;
    const seenYears = new Set<string>();
    const vals: number[] = [];
    const texts: string[] = [];
    dates.forEach((d, i) => {
      const year = d.slice(-4);
      const month = d.slice(0, 3);
      if (!seenYears.has(year) || month === "Jan") {
        if (!seenYears.has(year)) {
          seenYears.add(year);
          vals.push(i);
          texts.push(year);
        } else if (month === "Jan") {
          // Replace the earlier entry with Jan if we find it later
          const idx = texts.indexOf(year);
          if (idx !== -1) { vals[idx] = i; }
        }
      }
    });
    return { vals, texts };
  })();

  // Build a sorted union of all dates across all series (for multi-line charts
  // where different series may start/end at different quarters).
  const allDatesUnion: string[] = isQuarterly
    ? Array.from(new Set(series.flatMap((s) => s.data.map((d) => d.date)))).sort(
        (a, b) => {
          // "YYYY-YY Qn" — sort by year part first, then quarter digit
          if (a.slice(0, 7) !== b.slice(0, 7)) return a < b ? -1 : 1;
          return a.slice(-1) < b.slice(-1) ? -1 : 1;
        }
      )
    : [];

  // Map each date string to its integer index so Plotly uses a linear
  // (numeric) axis instead of a categorical axis.  Categorical axes in
  // Plotly can reorder values alphabetically; a linear axis with explicit
  // tick positions is fully under our control.
  const dateToIndex = new Map<string, number>(
    allDatesUnion.map((d, i) => [d, i])
  );

  // Tick positions: one tick per fiscal year, placed at the Q1 index.
  // Label text is just the year part, e.g. "2015-16".
  const q1Entries = allDatesUnion
    .map((d, i) => ({ d, i }))
    .filter(({ d }) => d.endsWith("Q1"));

  // ── Build Plotly traces ────────────────────────────────────────────────
  const data: Plotly.Data[] = series.map((s) => ({
    type: "scatter" as const,
    mode: showMarkers ? "lines+markers" : "lines",
    name: s.indicator,
    // Quarterly: use numeric index so the x-axis is linear and stays in order.
    // Non-quarterly: use the date string (Plotly handles annual strings fine).
    x: isQuarterly
      ? s.data.map((d) => dateToIndex.get(d.date) ?? 0)
      : s.data.map((d) => d.date),
    y: s.data.map((d) => d.value),
    // Store original label for hover tooltip
    customdata: s.data.map((d) => d.date),
    marker: { size: lineShape === "hv" ? 4 : 5, ...(s.color ? { color: s.color } : {}) },
    line: { width: 2, shape: lineShape, ...(s.color ? { color: s.color } : {}) },
    hovertemplate: isQuarterly
      ? `<b>${s.indicator}</b><br>%{customdata}: %{y:.2f} ${s.unit}<extra></extra>`
      : `<b>${s.indicator}</b><br>%{x}: %{y:.2f} ${s.unit}<extra></extra>`,
    ...(useDualAxis && unitToAxis[s.unit] === "y2" ? { yaxis: "y2" } : {}),
  }));

  // ── Build layout ───────────────────────────────────────────────────────
  const xaxisOverride: Partial<Plotly.LayoutAxis> = isQuarterly
    ? {
        // Numeric index axis: one labeled tick per fiscal year at Q1.
        tickmode: "array" as const,
        tickvals: q1Entries.map(({ i }) => i),
        ticktext: q1Entries.map(({ d }) => d.replace(" Q1", "")),
        tickangle: -45,
      }
    : isFiscalYear
      ? {
          // Category axis: Plotly must not try to parse "YYYY-YY" as a date.
          type: "category" as const,
          tickangle: -45,
        }
      : isCalendarMonthly
        ? {
            // Date axis with annual ticks so ~10+ years of monthly
            // data stays readable (~13 ticks vs one per month which is ~150+).
            // hoverformat is separate from tickformat so hover still shows
            // the full month ("Apr 2012") while ticks only show the year.
            type: "date" as const,
            dtick: "M12",
            tickformat: "%Y",
            hoverformat: "%b %Y",
            tickangle: 0,
          }
        : isMonthYear
          ? {
              // Category axis ("MMM YYYY"): show only one tick per year.
              type: "category" as const,
              tickmode: "array" as const,
              tickvals: monthYearAnnualTicks.vals,
              ticktext: monthYearAnnualTicks.texts,
              tickangle: 0,
            }
          : {};

  const layout: Partial<Plotly.Layout> = {
    xaxis: xaxisOverride,
    yaxis: {
      title: yAxisTitle
        ? { text: yAxisTitle }
        : useDualAxis
          ? { text: uniqueUnits[0] }
          : series.length === 1
            ? { text: series[0].unit }
            : undefined,
    },
    ...(useDualAxis
      ? {
          yaxis2: {
            title: { text: uniqueUnits[1] },
            overlaying: "y" as const,
            side: "right" as const,
            gridcolor: "transparent",
            showgrid: false,
          },
          // Widen right margin to fit the secondary axis label
          margin: { r: 60 },
        }
      : {}),
  };

  return (
    <PlotlyChart
      data={data}
      layout={layout}
      title={title}
      subtitle={subtitle}
      source={source}
      sourceUrl={sourceUrl}
      height={height}
    />
  );
}
