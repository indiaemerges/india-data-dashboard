import { useTheme } from "next-themes";

// ── Color computation — no Plotly dependency ──────────────────────────────────

/** [position 0–1, hex color string] */
type ColorStop = [number, string];

const DEFAULT_STOPS: ColorStop[] = [
  [0,    "#1e40af"],  // deep blue  (strongly negative / deflation)
  [0.25, "#60a5fa"],  // light blue (mildly negative)
  [0.45, "#d1fae5"],  // pale green (comfortably below target)
  [0.5,  "#fef9c3"],  // pale yellow (at midpoint / target)
  [0.6,  "#fed7aa"],  // light orange (slightly above target)
  [0.75, "#f97316"],  // orange (well above target)
  [1,    "#991b1b"],  // deep red  (very high)
];

/**
 * Build a diverging colorscale where `divideAt` maps to white/neutral,
 * deep blue anchors the minimum, and deep red anchors the maximum.
 */
function buildDivergingStops(
  zmin: number,
  zmax: number,
  divideAt: number
): ColorStop[] {
  const range = zmax - zmin;
  if (range <= 0) return DEFAULT_STOPS;
  const pos = Math.max(0.02, Math.min(0.98, (divideAt - zmin) / range));
  return [
    [0,                           "#1e40af"],
    [pos * 0.5,                   "#93c5fd"],
    [pos,                         "#f8fafc"],
    [pos + (1 - pos) * 0.35,     "#fde68a"],
    [pos + (1 - pos) * 0.65,     "#f97316"],
    [1,                           "#b2182b"],
  ];
}

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

/** Linear interpolation across a ColorStop array for t ∈ [0, 1]. */
function interpolateStops(stops: ColorStop[], t: number): string {
  t = Math.max(0, Math.min(1, t));
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [p0, c0] = stops[i - 1];
      const [p1, c1] = stops[i];
      const lt = p1 === p0 ? 0 : (t - p0) / (p1 - p0);
      const a = hexToRgb(c0);
      const b = hexToRgb(c1);
      return `rgb(${Math.round(a[0] + (b[0] - a[0]) * lt)},${Math.round(
        a[1] + (b[1] - a[1]) * lt
      )},${Math.round(a[2] + (b[2] - a[2]) * lt)})`;
    }
  }
  return stops[stops.length - 1][1];
}

/** WCAG-compliant contrast colour for text on a computed background. */
function contrastText(bgCss: string): string {
  const m = bgCss.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  const [r, g, b] = m ? [+m[1], +m[2], +m[3]] : [128, 128, 128];
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const lum = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return lum > 0.179 ? "#111827" : "#ffffff";
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface HeatmapChartProps {
  /** 2-D value array: z[rowIndex][colIndex] — null renders as a blank cell */
  z: (number | null)[][];
  /** Column labels displayed along the top (e.g. month abbreviations) */
  x: string[];
  /** Row labels displayed on the left (e.g. years or category names) */
  y: string[];
  /**
   * Custom colorscale as [[position 0–1, hexColor], ...].
   * Ignored when `divideAt` is provided.
   */
  colorscale?: ColorStop[];
  /**
   * Value that maps to white / neutral in the colorscale.
   * When set, a diverging colorscale is computed automatically.
   */
  divideAt?: number;
  /** @deprecated kept for API compat; use divideAt instead */
  zmid?: number;
  /** Clamp the colour-range minimum. Defaults to data minimum. */
  zmin?: number;
  /** Clamp the colour-range maximum. Defaults to data maximum. */
  zmax?: number;
  /** Suffix appended to formatted values (default: "%") */
  valueUnit?: string;
  /** Decimal places in cell annotations and tooltip (default: 1) */
  valuePrecision?: number;
  title?: string;
  subtitle?: string;
  source?: string;
  sourceUrl?: string;
  /** @deprecated kept for API compat; not used by the native renderer */
  height?: number;
  /** Display the numeric value inside each non-null cell (default: true) */
  showAnnotations?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function HeatmapChart({
  z,
  x,
  y,
  colorscale,
  divideAt,
  zmin,
  zmax,
  valueUnit = "%",
  valuePrecision = 1,
  title,
  subtitle,
  source,
  sourceUrl,
  showAnnotations = true,
}: HeatmapChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const fmt = (v: number) => v.toFixed(valuePrecision) + valueUnit;

  // ── Effective bounds ───────────────────────────────────────────────────────
  const allValues = z
    .flat()
    .filter((v): v is number => v !== null && isFinite(v));
  const dataMin = allValues.length > 0 ? Math.min(...allValues) : 0;
  const dataMax = allValues.length > 0 ? Math.max(...allValues) : 10;
  const effMin = zmin ?? dataMin;
  const effMax = zmax ?? dataMax;
  const range = (effMax - effMin) || 1;

  // ── Resolve color stops ────────────────────────────────────────────────────
  const stops: ColorStop[] =
    divideAt !== undefined
      ? buildDivergingStops(effMin, effMax, divideAt)
      : (colorscale ?? DEFAULT_STOPS);

  const cellBg = (val: number) =>
    interpolateStops(stops, (val - effMin) / range);

  // 11 evenly-spaced stops for the CSS gradient colorbar
  const gradientCss = Array.from({ length: 11 }, (_, i) =>
    interpolateStops(stops, i / 10)
  ).join(", ");

  // No-data cell background
  const noDataBg = isDark ? "#374151" : "#e5e7eb";
  const noDataText = isDark ? "#6b7280" : "#9ca3af";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      {/* Header */}
      {(title || subtitle) && (
        <div className="mb-3">
          {title && (
            <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-snug">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Scrollable table — horizontal scroll on mobile, full-width on desktop */}
      <div className="overflow-x-auto">
        <table
          className="border-separate text-[10px] leading-none w-full"
          style={{ borderSpacing: "2px" }}
        >
          {/* X-axis labels */}
          <thead>
            <tr>
              {/* Empty corner */}
              <th className="font-normal" style={{ minWidth: 48 }} />
              {x.map((col) => (
                <th
                  key={col}
                  className="font-medium text-center text-gray-500 dark:text-gray-400 pb-1 whitespace-nowrap px-0.5"
                  style={{ minWidth: 36 }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          {/* Rows */}
          <tbody>
            {y.map((rowLabel, ri) => (
              <tr key={rowLabel}>
                {/* Y-axis label */}
                <td
                  className="text-right text-gray-500 dark:text-gray-400 pr-2 whitespace-nowrap font-medium align-middle"
                  style={{ minWidth: 48 }}
                >
                  {rowLabel}
                </td>

                {/* Data cells */}
                {x.map((colLabel, ci) => {
                  const val = z[ri]?.[ci] ?? null;
                  const bg = val !== null ? cellBg(val) : noDataBg;
                  const color =
                    val !== null ? contrastText(bg) : noDataText;
                  return (
                    <td
                      key={ci}
                      title={
                        val !== null
                          ? `${rowLabel} · ${colLabel}: ${fmt(val)}`
                          : `${rowLabel} · ${colLabel}: no data`
                      }
                      className="text-center rounded-sm tabular-nums align-middle"
                      style={{
                        backgroundColor: bg,
                        color,
                        height: 28,
                        minWidth: 36,
                      }}
                    >
                      {showAnnotations && val !== null ? fmt(val) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CSS gradient colorbar */}
      <div className="mt-3 px-0.5">
        <div
          className="h-3 rounded"
          style={{ background: `linear-gradient(to right, ${gradientCss})` }}
        />
        <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
          <span>
            {effMin.toFixed(1)}
            {valueUnit}
          </span>
          <span>
            {effMax.toFixed(1)}
            {valueUnit}
          </span>
        </div>
      </div>

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
