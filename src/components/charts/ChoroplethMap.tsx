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

// ── Colorscale stops for contrast-adaptive annotation text ────────────────────
// Mirrors each named Plotly colorscale used in this dashboard (position 0–1).

type ColorStop = [number, string];

const COLORSCALE_STOPS: Record<string, ColorStop[]> = {
  YlOrRd:  [[0,"#ffffcc"],[0.25,"#fed976"],[0.5,"#fd8d3c"],[0.75,"#e31a1c"],[1,"#800026"]],
  Greens:  [[0,"#f7fcf5"],[0.25,"#c7e9c0"],[0.5,"#74c476"],[0.75,"#238b45"],[1,"#00441b"]],
  Blues:   [[0,"#f7fbff"],[0.25,"#c6dbef"],[0.5,"#6baed6"],[0.75,"#2171b5"],[1,"#08306b"]],
  Oranges: [[0,"#fff5eb"],[0.25,"#fdd0a2"],[0.5,"#fd8d3c"],[0.75,"#d94801"],[1,"#7f2704"]],
  Viridis: [[0,"#440154"],[0.25,"#3b528b"],[0.5,"#21908c"],[0.75,"#5dc963"],[1,"#fde725"]],
  RdBu:    [[0,"#67001f"],[0.25,"#d6604d"],[0.5,"#f7f7f7"],[0.75,"#4393c3"],[1,"#053061"]],
};

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function lerpNum(a: number, b: number, t: number) { return a + (b - a) * t; }

function interpolateStops(stops: ColorStop[], t: number): [number, number, number] {
  t = Math.max(0, Math.min(1, t));
  let lo = stops[0], hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (t <= stops[i + 1][0]) { lo = stops[i]; hi = stops[i + 1]; break; }
  }
  const f = lo[0] === hi[0] ? 0 : (t - lo[0]) / (hi[0] - lo[0]);
  const [r1, g1, b1] = hexToRgb(lo[1]);
  const [r2, g2, b2] = hexToRgb(hi[1]);
  return [lerpNum(r1, r2, f), lerpNum(g1, g2, f), lerpNum(b1, b2, f)];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * Returns "#111827" (near-black) or "#f9fafb" (near-white) to maximise
 * contrast against the interpolated colorscale colour at normalised t ∈ [0,1].
 * Switch-over at L ≈ 0.179 satisfies WCAG 2.1 AA for both choices.
 */
function contrastColor(colorscaleName: string, t: number): string {
  const stops = COLORSCALE_STOPS[colorscaleName] ?? COLORSCALE_STOPS["YlOrRd"];
  const lum = relativeLuminance(interpolateStops(stops, t));
  return lum > 0.179 ? "#111827" : "#f9fafb";
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
  const axisColor   = isDark ? "#9ca3af" : "#6b7280";         // gray-400 | gray-500

  // ── Non-null pairs for the data trace ────────────────────────────────────
  const nonNull = states
    .map((name, i) => ({ name, value: values[i] }))
    .filter((d): d is { name: string; value: number } => d.value !== null);

  // ── Centroid annotations ─────────────────────────────────────────────────
  const annoLons: number[]   = [];
  const annoLats: number[]   = [];
  const annoTexts: string[]  = [];
  const annoColors: string[] = [];   // per-point contrast-adaptive text colour

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
    // Normalised range used to position each value on the colorscale
    const lo = zmin ?? Math.min(...(values.filter((v) => v !== null) as number[]));
    const hi = zmax ?? Math.max(...(values.filter((v) => v !== null) as number[]));
    const range = hi - lo || 1;

    for (const feat of geo.features) {
      const name = feat.properties.ST_NM;
      const val = valueMap.get(name);
      if (val == null) continue;               // skip no-data states
      const c = featureCentroid(feat.geometry);
      if (!c) continue;
      annoLons.push(c.lon);
      annoLats.push(c.lat);
      annoTexts.push(val.toFixed(1));
      const t = Math.max(0, Math.min(1, (val - lo) / range));
      annoColors.push(contrastColor(colorscale, t));
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
  // textfont.color is a per-point array — dark on light fills, white on dark fills
  const annotTrace = {
    type: "scattergeo",
    lon: annoLons,
    lat: annoLats,
    text: annoTexts,
    mode: "text",
    textfont: { size: 12, color: annoColors, family: "sans-serif" },
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
