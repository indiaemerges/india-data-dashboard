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
}: LineChartProps) {
  const uniqueUnits = getUniqueUnits(series);
  const useDualAxis = uniqueUnits.length === 2 && !yAxisTitle;

  // Map each unit to its axis: first unique unit → y, second → y2
  const unitToAxis: Record<string, string> = {};
  if (useDualAxis) {
    unitToAxis[uniqueUnits[0]] = "y";
    unitToAxis[uniqueUnits[1]] = "y2";
  }

  // ── Quarterly detection ────────────────────────────────────────────────
  // Check if the first non-empty series has quarterly labels "YYYY-YY Qn"
  const firstSeriesDates =
    series.length > 0 ? series[0].data.map((d) => d.date) : [];
  const isQuarterly =
    firstSeriesDates.length > 0 &&
    /^\d{4}-\d{2} Q\d$/.test(firstSeriesDates[0]);

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
    marker: { size: 5 },
    line: { width: 2 },
    hovertemplate: isQuarterly
      ? `<b>${s.indicator}</b><br>%{customdata}: %{y:.2f} ${s.unit}<extra></extra>`
      : `<b>${s.indicator}</b><br>%{x}: %{y:.2f} ${s.unit}<extra></extra>`,
    ...(useDualAxis && unitToAxis[s.unit] === "y2" ? { yaxis: "y2" } : {}),
  }));

  // ── Build layout ───────────────────────────────────────────────────────
  const xaxisOverride: Partial<Plotly.LayoutAxis> = isQuarterly
    ? {
        tickmode: "array" as const,
        tickvals: q1Entries.map(({ i }) => i),
        ticktext: q1Entries.map(({ d }) => d.replace(" Q1", "")),
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
