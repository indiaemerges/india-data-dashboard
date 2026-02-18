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

  const data: Plotly.Data[] = series.map((s) => ({
    type: "scatter" as const,
    mode: showMarkers ? "lines+markers" : "lines",
    name: s.indicator,
    x: s.data.map((d) => d.date),
    y: s.data.map((d) => d.value),
    marker: { size: 5 },
    line: { width: 2 },
    hovertemplate: `<b>${s.indicator}</b><br>%{x}: %{y:.2f} ${s.unit}<extra></extra>`,
    ...(useDualAxis && unitToAxis[s.unit] === "y2" ? { yaxis: "y2" } : {}),
  }));

  const layout: Partial<Plotly.Layout> = {
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
