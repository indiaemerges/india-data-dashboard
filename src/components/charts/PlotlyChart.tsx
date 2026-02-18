import dynamic from "next/dynamic";
import { defaultLayout, defaultConfig } from "@/config/chart-themes.config";

// Dynamically import react-plotly.js with SSR disabled (Plotly requires window)
const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-80 bg-gray-50 rounded-lg border border-gray-200">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Loading chart...</p>
      </div>
    </div>
  ),
});

interface PlotlyChartProps {
  data: Plotly.Data[];
  layout?: Partial<Plotly.Layout>;
  config?: Partial<Plotly.Config>;
  title?: string;
  subtitle?: string;
  source?: string;
  sourceUrl?: string;
  className?: string;
  height?: number;
}

export default function PlotlyChart({
  data,
  layout = {},
  config = {},
  title,
  subtitle,
  source,
  sourceUrl,
  className = "",
  height = 400,
}: PlotlyChartProps) {
  // When an HTML title is rendered above the chart, suppress the Plotly
  // internal title to avoid duplication and shrink the top margin.
  const hasHtmlHeader = !!(title || subtitle);

  // Merge user layout with defaults
  const mergedLayout: Partial<Plotly.Layout> = {
    ...defaultLayout,
    ...layout,
    title: hasHtmlHeader ? undefined : (layout.title || undefined),
    height: layout.height || height,
    margin: {
      ...defaultLayout.margin,
      ...(hasHtmlHeader ? { t: 20 } : {}),
      ...layout.margin,
    },
    xaxis: { ...defaultLayout.xaxis, ...layout.xaxis },
    yaxis: { ...defaultLayout.yaxis, ...layout.yaxis },
    legend: { ...defaultLayout.legend, ...layout.legend },
    // Support dual y-axis: merge yaxis2 with sensible defaults if provided
    ...(layout.yaxis2
      ? {
          yaxis2: {
            tickfont: { size: 11 },
            separatethousands: true,
            ...layout.yaxis2,
          },
        }
      : {}),
  };

  const mergedConfig: Partial<Plotly.Config> = {
    ...defaultConfig,
    ...config,
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      {/* Chart header */}
      {(title || subtitle) && (
        <div className="mb-2">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      )}

      {/* Plotly chart */}
      <Plot
        data={data}
        layout={mergedLayout}
        config={mergedConfig}
        useResizeHandler
        className="w-full"
        style={{ width: "100%" }}
      />

      {/* Source attribution */}
      {source && (
        <div className="mt-2 text-xs text-gray-400">
          Source:{" "}
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 hover:underline"
            >
              {source}
            </a>
          ) : (
            source
          )}
        </div>
      )}
    </div>
  );
}
