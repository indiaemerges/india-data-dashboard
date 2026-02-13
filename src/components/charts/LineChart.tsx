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
  const data: Plotly.Data[] = series.map((s, i) => ({
    type: "scatter" as const,
    mode: showMarkers ? "lines+markers" : "lines",
    name: s.indicator,
    x: s.data.map((d) => d.date),
    y: s.data.map((d) => d.value),
    marker: { size: 5 },
    line: { width: 2 },
    hovertemplate: `<b>${s.indicator}</b><br>%{x}: %{y:.2f} ${s.unit}<extra></extra>`,
  }));

  const layout: Partial<Plotly.Layout> = {
    yaxis: {
      title: yAxisTitle ? { text: yAxisTitle } : (series.length === 1 ? { text: series[0].unit } : undefined),
    },
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
