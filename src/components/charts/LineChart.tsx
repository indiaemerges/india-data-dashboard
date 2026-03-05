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
  // The distinguishing rule: for Indian fiscal years the two-digit suffix
  // equals (YYYY + 1) mod 100.  e.g. 2008-09 → (2008+1)%100 = 9 ✓
  //                                  2012-04 → (2012+1)%100 = 13 ≠ 4 ✗
  const isFiscalYear = (() => {
    if (firstSeriesDates.length === 0) return false;
    const m = firstSeriesDates[0].match(/^(\d{4})-(\d{2})$/);
    if (!m) return false;
    return parseInt(m[2], 10) === (parseInt(m[1], 10) + 1) % 100;
  })();

  // Detect calendar-monthly strings "YYYY-MM" that are NOT fiscal years.
  // For these we apply an explicit 4-month tick interval so the axis stays
  // readable regardless of how many months of data are loaded.
  const isCalendarMonthly =
    !isQuarterly &&
    !isFiscalYear &&
    firstSeriesDates.length > 0 &&
    /^\d{4}-\d{2}$/.test(firstSeriesDates[0]);

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
            // Date axis with explicit 4-month interval so ~10 years of monthly
            // data stays readable (≈30 ticks vs one per month which is ~150).
            type: "date" as const,
            dtick: "M4",
            tickformat: "%b %Y",
            tickangle: -45,
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
