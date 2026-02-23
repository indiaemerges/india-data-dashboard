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

  const layout: Partial<Plotly.Layout> = {
    barmode: barMode,
    // For horizontal bars the y-axis holds category labels which can be long.
    // Increase the left margin so labels aren't clipped.
    ...(orientation === "h" ? { margin: { l: 160, r: 20, t: 20, b: 50 } } : {}),
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
