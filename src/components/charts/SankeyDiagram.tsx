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

/** Format a number with Indian locale grouping (e.g., 2,00,947) */
function formatValue(value: number, unit: string): string {
  return `${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })} ${unit}`;
}

export default function SankeyDiagram({
  data,
  title,
  subtitle,
  source,
  sourceUrl,
  height = 700,
}: SankeyDiagramProps) {
  // ── Column positions with slightly wider spacing ──────────────
  const columnXPositions = [0.001, 0.30, 0.63, 0.999];

  // ── Compute node throughput for richer hover labels ───────────
  const nodeThroughput = new Array(data.nodes.length).fill(0);
  for (const link of data.links) {
    nodeThroughput[link.source] += link.value;
    nodeThroughput[link.target] += link.value;
  }

  // Build custom node hover text with throughput
  const nodeHoverText = data.nodes.map((node, i) => {
    const val = nodeThroughput[i];
    if (val === 0) return node.label;
    return `<b>${node.label}</b><br>${formatValue(val, data.unit)}<extra></extra>`;
  });

  // Build enhanced link hover text with percentage
  const totalSupply = data.totalSupply || 1;
  const linkCustomData = data.links.map((l) => {
    const pct = ((l.value / totalSupply) * 100).toFixed(1);
    return `${pct}% of primary supply`;
  });

  const plotData: Plotly.Data[] = [
    {
      type: "sankey" as const,
      orientation: "h",
      arrangement: "snap",
      node: {
        pad: 24,
        thickness: 28,
        line: { color: "rgba(0,0,0,0.15)", width: 0.5 },
        label: data.nodes.map((n) => n.label),
        color: data.nodes.map((n) => n.color),
        x: data.nodes.map((n) => columnXPositions[n.column]),
        hovertemplate: "%{customdata}<extra></extra>",
        customdata: nodeHoverText,
      },
      link: {
        source: data.links.map((l) => l.source),
        target: data.links.map((l) => l.target),
        value: data.links.map((l) => l.value),
        color: data.links.map((l) => l.color),
        label: data.links.map((l) => l.label),
        customdata: linkCustomData,
        hovertemplate:
          `<b>%{label}</b><br>` +
          `%{value:,.0f} ${data.unit}<br>` +
          `<span style="color:#888">%{customdata}</span>` +
          `<extra></extra>`,
      },
    },
  ];

  const layout: Partial<Plotly.Layout> = {
    height,
    margin: { l: 10, r: 10, t: 40, b: 10 },
    font: {
      family: "Inter, system-ui, sans-serif",
      size: 12,
      color: "#374151",
    },
    paper_bgcolor: "transparent",
    hovermode: "closest",
    // Column header annotations
    annotations: [
      {
        x: 0.001,
        y: 1.06,
        text: "<b>Sources</b>",
        showarrow: false,
        font: { size: 13, color: "#4B5563", family: "Inter, system-ui, sans-serif" },
        xref: "paper",
        yref: "paper",
        xanchor: "left",
      },
      {
        x: 0.30,
        y: 1.06,
        text: "<b>Primary Energy</b>",
        showarrow: false,
        font: { size: 13, color: "#4B5563", family: "Inter, system-ui, sans-serif" },
        xref: "paper",
        yref: "paper",
        xanchor: "center",
      },
      {
        x: 0.63,
        y: 1.06,
        text: "<b>Transformation</b>",
        showarrow: false,
        font: { size: 13, color: "#4B5563", family: "Inter, system-ui, sans-serif" },
        xref: "paper",
        yref: "paper",
        xanchor: "center",
      },
      {
        x: 0.999,
        y: 1.06,
        text: "<b>End-Use Sectors</b>",
        showarrow: false,
        font: { size: 13, color: "#4B5563", family: "Inter, system-ui, sans-serif" },
        xref: "paper",
        yref: "paper",
        xanchor: "right",
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
