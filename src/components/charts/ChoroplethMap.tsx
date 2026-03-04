import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useIndiaGeoJSON } from "@/lib/hooks/useMospiState";

// Dynamically import react-plotly.js (requires window)
const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-80 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading map...</p>
      </div>
    </div>
  ),
});

interface ChoroplethMapProps {
  title?: string;
  subtitle?: string;
  source?: string;
  sourceUrl?: string;
  /** Values matching GeoJSON ST_NM property */
  states: string[];
  /** Parallel to states[]. null → state left un-coloured */
  values: (number | null)[];
  unit: string;
  /** Any Plotly named colorscale (e.g. "YlOrRd", "Greens", "RdYlGn") */
  colorscale?: string;
  /** Reverse the colorscale direction */
  reversescale?: boolean;
  zmin?: number;
  zmax?: number;
  height?: number;
  className?: string;
}

export default function ChoroplethMap({
  title,
  subtitle,
  source,
  sourceUrl,
  states,
  values,
  unit,
  colorscale = "YlOrRd",
  reversescale = false,
  zmin,
  zmax,
  height = 480,
  className = "",
}: ChoroplethMapProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { data: geoJson, isLoading: geoLoading } = useIndiaGeoJSON();

  // Filter out null values — choropleth z cannot contain null
  const nonNull = states
    .map((name, i) => ({ name, value: values[i] }))
    .filter((d): d is { name: string; value: number } => d.value !== null);

  // Plotly's TS types don't fully cover choropleth-specific props (geojson,
  // featureidkey), so we build as a plain object and cast via unknown.
  const trace = {
    type: "choropleth",
    geojson: geoJson,
    featureidkey: "properties.ST_NM",
    locations: nonNull.map((d) => d.name),
    z: nonNull.map((d) => d.value),
    colorscale,
    reversescale,
    ...(zmin !== undefined ? { zmin } : {}),
    ...(zmax !== undefined ? { zmax } : {}),
    marker: {
      line: {
        color: isDark ? "#4b5563" : "#e5e7eb", // gray-600 | gray-200
        width: 0.8,
      },
    },
    colorbar: {
      title: {
        text: unit,
        font: { size: 11, color: isDark ? "#9ca3af" : "#6b7280" },
        side: "right",
      },
      thickness: 14,
      len: 0.65,
      tickfont: { size: 10, color: isDark ? "#9ca3af" : "#6b7280" },
      outlinewidth: 0,
    },
    hovertemplate:
      "<b>%{location}</b><br>%{z:.1f} " + unit + "<extra></extra>",
  };

  const layout: Partial<Plotly.Layout> = {
    paper_bgcolor: isDark ? "#1f2937" : "white",
    plot_bgcolor: isDark ? "#1f2937" : "white",
    height,
    margin: { t: 0, b: 0, l: 0, r: 0, pad: 0 },
    showlegend: false,
    geo: {
      showframe: false,
      showcoastlines: false,
      showland: false,
      showocean: false,
      showlakes: false,
      showcountries: false,
      fitbounds: "locations" as const,
      bgcolor: isDark ? "#1f2937" : "white",
      projection: { type: "mercator" as const },
    },
  };

  const config: Partial<Plotly.Config> = {
    displayModeBar: false,
    responsive: true,
    scrollZoom: false,
  };

  const isReady = !geoLoading && geoJson;

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}
    >
      {/* Chart header */}
      {(title || subtitle) && (
        <div className="mb-2">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Map or loading state */}
      {!isReady ? (
        <div
          className="flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg"
          style={{ height }}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading map…
            </p>
          </div>
        </div>
      ) : (
        <Plot
          data={[trace as Plotly.Data]}
          layout={layout}
          config={config}
          useResizeHandler
          className="w-full"
          style={{ width: "100%" }}
        />
      )}

      {/* Source attribution */}
      {source && (
        <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
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
