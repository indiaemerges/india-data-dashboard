import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import {
  interpolateYlOrRd,
  interpolateGreens,
  interpolateBlues,
  interpolateOranges,
  interpolateViridis,
  interpolateRdBu,
} from "d3-scale-chromatic";
import { useTheme } from "next-themes";
import { useState, useEffect, useMemo, useRef } from "react";
import { useIndiaGeoJSON } from "@/lib/hooks/useMospiState";

// ── Colorscale interpolators ───────────────────────────────────────────────────

type ColorInterpolator = (t: number) => string;

const INTERPOLATORS: Record<string, ColorInterpolator> = {
  YlOrRd:  interpolateYlOrRd,
  Greens:  interpolateGreens,
  Blues:   interpolateBlues,
  Oranges: interpolateOranges,
  Viridis: interpolateViridis,
  RdBu:    interpolateRdBu,
};

// ── Contrast-adaptive text colour ─────────────────────────────────────────────
// d3 interpolators return "rgb(r, g, b)" strings — we parse directly so there
// is no separate color-stop lookup table needed.

function parseRgb(css: string): [number, number, number] {
  const m = css.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (m) return [+m[1], +m[2], +m[3]];
  if (css.startsWith("#"))
    return [
      parseInt(css.slice(1, 3), 16),
      parseInt(css.slice(3, 5), 16),
      parseInt(css.slice(5, 7), 16),
    ];
  return [128, 128, 128];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG-compliant contrast choice: dark text on light fills, white on dark. */
function contrastTextColor(fillCss: string): string {
  return relativeLuminance(parseRgb(fillCss)) > 0.179 ? "#111827" : "#f9fafb";
}

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
      // Use the largest polygon ring so island-chains label sensibly
      const rings = (geom.coordinates as Coord[][][]).map((p) => p[0]);
      const largest = rings.reduce((a, b) => (a.length > b.length ? a : b));
      return ringCentroid(largest);
    }
    return null;
  } catch {
    return null;
  }
}

// ── Colorbar ──────────────────────────────────────────────────────────────────

interface ColorBarProps {
  lo: number;
  hi: number;
  interpolator: ColorInterpolator;
  reversescale: boolean;
  unit: string;
}

function ColorBar({ lo, hi, interpolator, reversescale, unit }: ColorBarProps) {
  // 11 stops → smooth gradient
  const stops = Array.from({ length: 11 }, (_, i) => {
    const t = i / 10;
    return interpolator(reversescale ? 1 - t : t);
  }).join(", ");

  return (
    <div className="mt-3 px-1">
      <div
        className="h-3 rounded"
        style={{ background: `linear-gradient(to right, ${stops})` }}
      />
      <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
        <span>{lo.toFixed(1)}</span>
        <span className="text-gray-400 dark:text-gray-500 text-[10px]">{unit}</span>
        <span>{hi.toFixed(1)}</span>
      </div>
    </div>
  );
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
  /** Kept for API compatibility; SVG auto-sizes via aspect ratio */
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
  className = "",
}: ChoroplethMapProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { data: geoJson, isLoading: geoLoading } = useIndiaGeoJSON();
  const mapRef = useRef<HTMLDivElement>(null);

  // ── Responsive: hide dense annotations on phones/tablets ─────────────────
  const [hideAnnotations, setHideAnnotations] = useState(false);
  useEffect(() => {
    const check = () => setHideAnnotations(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Hover / tap tooltip ───────────────────────────────────────────────────
  const [tooltip, setTooltip] = useState<{
    name: string;
    value: number | null;
    x: number;
    y: number;
  } | null>(null);

  // ── Colour scale ──────────────────────────────────────────────────────────
  const valueMap = useMemo(
    () => new Map(states.map((s, i) => [s, values[i]])),
    [states, values]
  );

  const nonNullVals = useMemo(
    () => values.filter((v): v is number => v !== null),
    [values]
  );

  const lo = zmin ?? (nonNullVals.length ? Math.min(...nonNullVals) : 0);
  const hi = zmax ?? (nonNullVals.length ? Math.max(...nonNullVals) : 1);
  const range = hi - lo || 1;

  const interpolator = INTERPOLATORS[colorscale] ?? INTERPOLATORS.YlOrRd;

  const colorFn = (val: number): string => {
    const t = Math.max(0, Math.min(1, (val - lo) / range));
    return interpolator(reversescale ? 1 - t : t);
  };

  // ── Theme-aware static colours ────────────────────────────────────────────
  const noDataFill  = isDark ? "#374151" : "#e5e7eb";   // gray-700 | gray-200
  const strokeColor = isDark ? "#6b7280" : "#d1d5db";   // gray-500 | gray-300

  const isReady = !geoLoading && !!geoJson;

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
        <div className="flex items-center justify-center h-80 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading map…
            </p>
          </div>
        </div>
      ) : (
        <div ref={mapRef} className="relative select-none">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ center: [82, 22], scale: 800 }}
            width={800}
            height={600}
            style={{ width: "100%", height: "auto", display: "block" }}
          >
            <Geographies geography={geoJson}>
              {({ geographies }) => (
                <>
                  {/* ── Fill layer ── */}
                  {geographies.map((geo) => {
                    const name = geo.properties.ST_NM as string;
                    const val = valueMap.get(name) ?? null;
                    const fill = val !== null ? colorFn(val) : noDataFill;
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={fill}
                        stroke={strokeColor}
                        strokeWidth={0.5}
                        style={{
                          default: { outline: "none" },
                          hover:   { outline: "none", opacity: 0.8, cursor: "pointer" },
                          pressed: { outline: "none" },
                        }}
                        onMouseEnter={(e: React.MouseEvent) => {
                          const rect = mapRef.current?.getBoundingClientRect();
                          if (!rect) return;
                          setTooltip({
                            name,
                            value: val,
                            x: e.clientX - rect.left,
                            y: e.clientY - rect.top,
                          });
                        }}
                        onMouseLeave={() => setTooltip(null)}
                        onClick={(e: React.MouseEvent) => {
                          // Tap-to-reveal on touch devices
                          const rect = mapRef.current?.getBoundingClientRect();
                          if (!rect) return;
                          setTooltip((prev) =>
                            prev?.name === name
                              ? null
                              : {
                                  name,
                                  value: val,
                                  x: e.clientX - rect.left,
                                  y: e.clientY - rect.top,
                                }
                          );
                        }}
                      />
                    );
                  })}

                  {/* ── Annotation layer — hidden below md breakpoint ── */}
                  {showAnnotations &&
                    !hideAnnotations &&
                    geographies.map((geo) => {
                      const name = geo.properties.ST_NM as string;
                      const val = valueMap.get(name) ?? null;
                      if (val === null) return null;
                      const c = featureCentroid(
                        geo.geometry as {
                          type: string;
                          coordinates: unknown;
                        }
                      );
                      if (!c) return null;
                      const fill = colorFn(val);
                      return (
                        <Marker
                          key={`anno-${name}`}
                          coordinates={[c.lon, c.lat]}
                        >
                          <text
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize={8}
                            fontFamily="sans-serif"
                            fontWeight="500"
                            fill={contrastTextColor(fill)}
                            style={{
                              pointerEvents: "none",
                              userSelect: "none",
                            }}
                          >
                            {val.toFixed(1)}
                          </text>
                        </Marker>
                      );
                    })}
                </>
              )}
            </Geographies>
          </ComposableMap>

          {/* Tooltip */}
          {tooltip && (
            <div
              className="absolute z-10 pointer-events-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg px-2.5 py-1.5 text-sm"
              style={{
                left: Math.min(
                  tooltip.x + 12,
                  (mapRef.current?.offsetWidth ?? 300) - 170
                ),
                top: Math.max(tooltip.y - 44, 4),
              }}
            >
              <p className="font-medium text-gray-900 dark:text-white leading-tight">
                {tooltip.name}
              </p>
              <p className="text-gray-600 dark:text-gray-300 leading-tight">
                {tooltip.value !== null
                  ? `${tooltip.value.toFixed(1)} ${unit}`
                  : "No data"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Colorbar */}
      {isReady && nonNullVals.length > 0 && (
        <ColorBar
          lo={lo}
          hi={hi}
          interpolator={interpolator}
          reversescale={reversescale}
          unit={unit}
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
