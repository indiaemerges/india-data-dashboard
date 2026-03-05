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
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading map…</p>
      </div>
    </div>
  ),
});

// ── Centroid computation from GeoJSON geometry ─────────────────────────────────

type Coord = [number, number];

function ringCentroid(ring: Coord[]): { lon: number; lat: number } {
  const n = ring.length;
  return {
    lon: ring.reduce((s, c) => s + c[0], 0) / n,
    lat: ring.reduce((s, c) => s + c[1], 0) / n,
  };
}

function featureCentroid(
  geom: { type: string; coordinates: unknown }
): { lon: number; lat: number } | null {
  try {
    if (geom.type === "Polygon") {
      return ringCentroid((geom.coordinates as Coord[][])[0]);
    }
    if (geom.type === "MultiPolygon") {
      // Use the largest polygon's outer ring for a sensible label position
      const rings = (geom.coordinates as Coord[][][]).map((poly) => poly[0]);
      const largest = rings.reduce((a, b) => (a.length > b.length ? a : b));
      return ringCentroid(largest);
    }
    return null;
  } catch {
    return null;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface ChoroplethMapProps {
  title?: string;
  subtitle?: string;
  source?: string;
  sourceUrl?: string;
  /** All state/UT geoNames (parallel to values[], including no-data states) */
  states: string[];
  /** Parallel to states[]. null → boundary shown but no fill / annotation */
  values: (number | null)[];
  unit: string;
  colorscale?: string;
  reversescale?: boolean;
  zmin?: number;
  zmax?: number;
  /** Show numeric value labels at each state centroid (default: true) */
  showAnnotations?: boolean;
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
  showAnnotations = true,
  height = 480,
  className = "",
}: ChoroplethMapProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { data: geoJson, isLoading: geoLoading } = useIndiaGeoJSON();

  // Theme-aware colours
  const borderColor = isDark ? "#6b7280" : "#d1d5db";       // gray-500 | gray-300
  const grayFill    = isDark ? "rgba(75,85,99,0.5)"          // gray-600/50
                             : "rgba(229,231,235,0.8)";       // gray-200/80
  const textColor   = isDark ? "#f9fafb" : "#111827";         // gray-50 | gray-900
  const axisColor   = isDark ? "#9ca3af" : "#6b7280";         // gray-400 | gray-500

  // ── Non-null pairs for the data trace ────────────────────────────────────
  const nonNull = states
    .map((name, i) => ({ name, value: values[i] }))
    .filter((d): d is { name: string; value: number } => d.value !== null);

  // ── Centroid annotations ─────────────────────────────────────────────────
  const annoLons: number[] = [];
  const annoLats: number[] = [];
  const annoTexts: string[] = [];

  if (geoJson && showAnnotations) {
    const geo = geoJson as {
      features: Array<{
        properties: { ST_NM: string };
        geometry: { type: string; coordinates: unknown };
      }>;
    };
    const valueMap = new Map<string, number | null>(
      states.map((s, i) => [s, values[i]])
    );
    for (const feat of geo.features) {
      const name = feat.properties.ST_NM;
      const val = valueMap.get(name);
      if (val == null) continue;               // skip no-data states
      const c = featureCentroid(feat.geometry);
      if (!c) continue;
      annoLons.push(c.lon);
      annoLats.push(c.lat);
      annoTexts.push(val.toFixed(1));
    }
  }

  // ── Build Plotly traces ──────────────────────────────────────────────────

  // Trace 1 — base: every state shown in neutral gray so no boundaries vanish
  const baseTrace = {
    type: "choropleth",
    geojson: geoJson,
    featureidkey: "properties.ST_NM",
    locations: states,
    z: states.map(() => 0),
    zmin: -1,
    zmax: 1,
    // Flat neutral colorscale (start = end = same grey)
    colorscale: [[0, grayFill], [0.5, grayFill], [1, grayFill]],
    showscale: false,
    marker: { line: { color: borderColor, width: 1 } },
    hoverinfo: "skip" as const,
  };

  // Trace 2 — data: non-null states filled by indicator value
  const dataTrace = {
    type: "choropleth",
    geojson: geoJson,
    featureidkey: "properties.ST_NM",
    locations: nonNull.map((d) => d.name),
    z: nonNull.map((d) => d.value),
    colorscale,
    reversescale,
    ...(zmin !== undefined ? { zmin } : {}),
    ...(zmax !== undefined ? { zmax } : {}),
    marker: { line: { color: borderColor, width: 1 } },
    colorbar: {
      title: {
        text: unit,
        font: { size: 11, color: axisColor },
        side: "right",
      },
      thickness: 14,
      len: 0.65,
      tickfont: { size: 10, color: axisColor },
      outlinewidth: 0,
    },
    hovertemplate: "<b>%{location}</b><br>%{z:.1f} " + unit + "<extra></extra>",
  };

  // Trace 3 — annotation: text values at state centroids
  const annotTrace = {
    type: "scattergeo",
    lon: annoLons,
    lat: annoLats,
    text: annoTexts,
    mode: "text",
    textfont: { size: 8, color: textColor, family: "sans-serif" },
    hoverinfo: "skip" as const,
    showlegend: false,
  };

  const traces = showAnnotations
    ? [baseTrace, dataTrace, annotTrace]
    : [baseTrace, dataTrace];

  // ── Layout ───────────────────────────────────────────────────────────────
  const layout: Partial<Plotly.Layout> = {
    paper_bgcolor: isDark ? "#1f2937" : "white",
    plot_bgcolor:  isDark ? "#1f2937" : "white",
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
      // Use base trace (all states) to define map extent
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
          data={traces as Plotly.Data[]}
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
