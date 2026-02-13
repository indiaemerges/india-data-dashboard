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
  const data: Plotly.Data[] = series.map((s) => {
    const baseTrace = {
      type: "bar" as const,
      name: s.indicator,
      orientation,
      hovertemplate:
        orientation === "v"
          ? `<b>${s.indicator}</b><br>%{x}: %{y:.2f} ${s.unit}<extra></extra>`
          : `<b>${s.indicator}</b><br>%{y}: %{x:.2f} ${s.unit}<extra></extra>`,
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
