import PlotlyChart from "./PlotlyChart";
import type { DataSeries } from "@/lib/api/types";

interface BarChartProps {
  series: DataSeries[];
  title?: string;
  subtitle?: string;
  source?: string;
  sourceUrl?: string;
  orientation?: "v" | "h";
  barMode?: "group" | "stack";
  yAxisTitle?: string;
  height?: number;
}

/**
 * Detect whether series have different units and need dual y-axes.
 */
function getUniqueUnits(series: DataSeries[]): string[] {
  const seen = new Set<string>();
  for (const s of series) {
    seen.add(s.unit);
  }
  return [...seen];
}

export default function BarChart({
  series,
  title,
  subtitle,
  source,
  sourceUrl,
  orientation = "v",
  barMode = "group",
  yAxisTitle,
  height = 400,
}: BarChartProps) {
  const uniqueUnits = getUniqueUnits(series);
  const useDualAxis = uniqueUnits.length === 2 && !yAxisTitle && orientation === "v";

  const unitToAxis: Record<string, string> = {};
  if (useDualAxis) {
    unitToAxis[uniqueUnits[0]] = "y";
    unitToAxis[uniqueUnits[1]] = "y2";
  }

  const data: Plotly.Data[] = series.map((s) => {
    const baseTrace = {
      type: "bar" as const,
      name: s.indicator,
      orientation,
      hovertemplate:
        orientation === "v"
          ? `<b>${s.indicator}</b><br>%{x}: %{y:.2f} ${s.unit}<extra></extra>`
          : `<b>${s.indicator}</b><br>%{y}: %{x:.2f} ${s.unit}<extra></extra>`,
      ...(useDualAxis && unitToAxis[s.unit] === "y2" ? { yaxis: "y2" } : {}),
    };

    if (orientation === "h") {
      return {
        ...baseTrace,
        y: s.data.map((d) => d.label || d.date),
        x: s.data.map((d) => d.value),
      };
    }

    return {
      ...baseTrace,
      x: s.data.map((d) => d.date),
      y: s.data.map((d) => d.value),
    };
  });

  // Detect quarterly data on the x-axis (vertical bars): labels like "2024-25 Q1"
  // Enforce chronological order and show only yearly ticks (at Q1 boundaries).
  const allDates =
    orientation === "v" && series.length > 0
      ? series[0].data.map((d) => d.date)
      : [];
  const isQuarterly =
    allDates.length > 0 && /^\d{4}-\d{2} Q\d$/.test(allDates[0]);

  const xaxisQuarterlyOverride: Partial<Plotly.LayoutAxis> = isQuarterly
    ? {
        categoryorder: "array" as const,
        categoryarray: allDates,
        tickmode: "array" as const,
        tickvals: allDates.filter((d) => d.endsWith("Q1")),
        ticktext: allDates
          .filter((d) => d.endsWith("Q1"))
          .map((d) => d.replace(" Q1", "")),
        tickangle: -45,
      }
    : {};

  const layout: Partial<Plotly.Layout> = {
    barmode: barMode,
    xaxis: xaxisQuarterlyOverride,
    // For horizontal bars the y-axis holds category labels which can be long.
    // Increase the left margin so labels aren't clipped. b and t are left to
    // PlotlyChart's merge logic so the legend/header logic applies correctly.
    ...(orientation === "h" ? { margin: { l: 160, r: 20 } } : {}),
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
