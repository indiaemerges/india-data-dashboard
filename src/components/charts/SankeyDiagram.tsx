import PlotlyChart from "./PlotlyChart";
import type { SankeyData } from "@/lib/api/types";

interface SankeyDiagramProps {
  data: SankeyData;
  title?: string;
  subtitle?: string;
  source?: string;
  sourceUrl?: string;
  height?: number;
}

export default function SankeyDiagram({
  data,
  title,
  subtitle,
  source,
  sourceUrl,
  height = 700,
}: SankeyDiagramProps) {
  // Map each node's column index to an x position across the diagram
  const columnXPositions = [0.01, 0.33, 0.66, 0.99];

  const plotData: Plotly.Data[] = [
    {
      type: "sankey" as const,
      orientation: "h",
      arrangement: "snap",
      node: {
        pad: 20,
        thickness: 25,
        line: { color: "rgba(0,0,0,0.3)", width: 0.5 },
        label: data.nodes.map((n) => n.label),
        color: data.nodes.map((n) => n.color),
        x: data.nodes.map((n) => columnXPositions[n.column]),
        // Let Plotly auto-arrange vertical positions for optimal layout
      },
      link: {
        source: data.links.map((l) => l.source),
        target: data.links.map((l) => l.target),
        value: data.links.map((l) => l.value),
        color: data.links.map((l) => l.color),
        label: data.links.map((l) => l.label),
        hovertemplate: `%{label}<br>%{value:,.0f} ${data.unit}<extra></extra>`,
      },
    },
  ];

  const layout: Partial<Plotly.Layout> = {
    height,
    margin: { l: 10, r: 10, t: 10, b: 10 },
    font: {
      family: "Inter, system-ui, sans-serif",
      size: 12,
      color: "#374151",
    },
    paper_bgcolor: "transparent",
    hovermode: "closest",
    annotations: [
      {
        x: 0.01,
        y: 1.08,
        text: "Sources",
        showarrow: false,
        font: { size: 14, color: "#6B7280", family: "Inter" },
        xref: "paper",
        yref: "paper",
      },
      {
        x: 0.33,
        y: 1.08,
        text: "Primary Energy",
        showarrow: false,
        font: { size: 14, color: "#6B7280", family: "Inter" },
        xref: "paper",
        yref: "paper",
      },
      {
        x: 0.66,
        y: 1.08,
        text: "Transformation",
        showarrow: false,
        font: { size: 14, color: "#6B7280", family: "Inter" },
        xref: "paper",
        yref: "paper",
      },
      {
        x: 0.99,
        y: 1.08,
        text: "End-Use Sectors",
        showarrow: false,
        font: { size: 14, color: "#6B7280", family: "Inter" },
        xref: "paper",
        yref: "paper",
      },
    ],
  };

  return (
    <PlotlyChart
      data={plotData}
      layout={layout}
      title={title}
      subtitle={subtitle}
      source={source}
      sourceUrl={sourceUrl}
      height={height}
    />
  );
}
