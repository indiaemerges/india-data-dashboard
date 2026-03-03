import PlotlyChart from "./PlotlyChart";

// ── Default colorscale: blue (low/deflation) → yellow (mid/target) → red (high) ──
// Designed for CPI context where 4% is RBI's target midpoint.
// Callers can override with any Plotly-compatible ColorScale.
const DEFAULT_COLORSCALE: [number, string][] = [
  [0,    "#1e40af"],  // deep blue  (strongly negative / deflation)
  [0.25, "#60a5fa"],  // light blue (mildly negative)
  [0.45, "#d1fae5"],  // pale green (comfortably below target)
  [0.5,  "#fef9c3"],  // pale yellow (at midpoint / target)
  [0.6,  "#fed7aa"],  // light orange (slightly above target)
  [0.75, "#f97316"],  // orange (well above target)
  [1,    "#991b1b"],  // deep red  (very high inflation)
];

/**
 * Build a diverging colorscale where `divideAt` maps to white/neutral,
 * deep blue anchors the minimum, and deep red anchors the maximum.
 *
 * @param zmin  - effective lower bound of the data range
 * @param zmax  - effective upper bound of the data range
 * @param divideAt - value that should appear white/neutral (typically 0)
 */
function buildDivergingColorscale(
  zmin: number,
  zmax: number,
  divideAt: number
): [number, string][] {
  const range = zmax - zmin;
  if (range <= 0) return DEFAULT_COLORSCALE;

  // Position of the neutral point in [0, 1] colorscale space
  const pos = Math.max(0.02, Math.min(0.98, (divideAt - zmin) / range));

  return [
    [0,                           "#1e40af"],  // deep blue    (zmin)
    [pos * 0.5,                   "#93c5fd"],  // light blue
    [pos,                         "#f8fafc"],  // white/neutral (divideAt = 0%)
    [pos + (1 - pos) * 0.35,     "#fde68a"],  // pale yellow  (~RBI target zone)
    [pos + (1 - pos) * 0.65,     "#f97316"],  // orange       (elevated)
    [1,                           "#b2182b"],  // deep red     (zmax)
  ];
}

interface HeatmapChartProps {
  /** 2-D value array: z[rowIndex][colIndex] — null renders as blank cell */
  z: (number | null)[][];
  /** Column labels displayed on the x-axis (e.g. month names) */
  x: string[];
  /** Row labels displayed on the y-axis (e.g. year strings or category names) */
  y: string[];
  /**
   * Plotly ColorScale — a named string ("RdYlGn") or custom
   * [[position 0–1, cssColor], ...] array.
   * Ignored when `divideAt` is provided (colorscale is computed automatically).
   */
  colorscale?: Plotly.ColorScale;
  /**
   * When set, the colorscale is computed so that `divideAt` maps to
   * white/neutral, deep blue anchors zmin, and deep red anchors zmax.
   * Overrides `zmid` and the caller-supplied `colorscale`.
   *
   * Typical usage: `divideAt={0}` places white at 0% inflation,
   * with blue for deflation and red for inflation regardless of
   * whether the data range is symmetric.
   *
   * If `zmin` is not provided it is auto-computed from the data.
   */
  divideAt?: number;
  /**
   * The value that maps to the centre of the color scale.
   * For CPI, use 4 (RBI&apos;s inflation target). For growth-rate data, use 0.
   * Ignored when `divideAt` is provided.
   */
  zmid?: number;
  /** Clamp the colour range minimum. Leave undefined to auto-range. */
  zmin?: number;
  /** Clamp the colour range maximum. Leave undefined to auto-range. */
  zmax?: number;
  /**
   * Suffix appended to values in the hover tooltip and colorbar.
   * Default: "%"
   */
  valueUnit?: string;
  /**
   * Number of decimal places shown in hover + annotations.
   * Default: 1
   */
  valuePrecision?: number;
  title?: string;
  subtitle?: string;
  source?: string;
  sourceUrl?: string;
  height?: number;
  /**
   * If true, display the numeric value inside every non-null cell.
   * Best for small matrices (≤ 10×10). Default: false.
   */
  showAnnotations?: boolean;
}

export default function HeatmapChart({
  z,
  x,
  y,
  colorscale = DEFAULT_COLORSCALE,
  divideAt,
  zmid,
  zmin,
  zmax,
  valueUnit = "%",
  valuePrecision = 1,
  title,
  subtitle,
  source,
  sourceUrl,
  height = 380,
  showAnnotations = false,
}: HeatmapChartProps) {
  const fmt = (v: number) => v.toFixed(valuePrecision) + valueUnit;

  // ── Compute effective data bounds (used for colorscale & annotation contrast) ──
  const allValues = z
    .flat()
    .filter((v): v is number => v !== null && isFinite(v));
  const dataMin = allValues.length > 0 ? Math.min(...allValues) : -12.5;
  const dataMax = allValues.length > 0 ? Math.max(...allValues) : 12.5;
  const effectiveZmin = zmin !== undefined ? zmin : dataMin;
  const effectiveZmax = zmax !== undefined ? zmax : dataMax;

  // ── Resolve colorscale when divideAt is used ──────────────────────────────
  let resolvedColorscale: Plotly.ColorScale = colorscale;
  let resolvedZmid: number | undefined = zmid;

  if (divideAt !== undefined) {
    resolvedZmid = undefined;  // let the custom colorscale handle centering
    resolvedColorscale = buildDivergingColorscale(effectiveZmin, effectiveZmax, divideAt);
  }

  // ── Plotly heatmap trace ──────────────────────────────────────────────────
  const trace: Plotly.Data = {
    type: "heatmap",
    x,
    y,
    z,
    colorscale: resolvedColorscale,
    ...(resolvedZmid !== undefined ? { zmid: resolvedZmid } : {}),
    zmin: effectiveZmin,
    zmax: effectiveZmax,
    colorbar: {
      title: { text: valueUnit, side: "right" as const },
      ticksuffix: valueUnit,
      thickness: 14,
      len: 0.85,
      tickfont: { size: 10 },
    },
    hovertemplate:
      `<b>%{y}</b> · %{x}<br>` +
      `%{z:.${valuePrecision}f}${valueUnit}<extra></extra>`,
    xgap: 2,
    ygap: 2,
    showscale: true,
  };

  // ── Optional cell annotations with contrast-aware text colour ─────────────
  // pos in [0, 1] maps a value onto the colorscale range.
  // The dark regions are near 0 (deep blue) and near 1 (deep red/orange),
  // so we use white text there and dark text in the pale middle band.
  const annotRange = effectiveZmax - effectiveZmin;
  const annotTextColor = (val: number): string => {
    const pos = annotRange > 0 ? (val - effectiveZmin) / annotRange : 0.5;
    return pos < 0.22 || pos > 0.72 ? "#ffffff" : "#1f2937";
  };

  const annotations: Partial<Plotly.Annotations>[] = showAnnotations
    ? y.flatMap((rowLabel, ri) =>
        x.map((colLabel, ci) => {
          const val = z[ri]?.[ci];
          return {
            x: colLabel,
            y: rowLabel,
            text: val != null ? fmt(val) : "",
            showarrow: false,
            font: { size: 9, color: val != null ? annotTextColor(val) : "#1f2937" },
          } as Partial<Plotly.Annotations>;
        })
      )
    : [];

  // ── Layout overrides ──────────────────────────────────────────────────────
  // The parent PlotlyChart component applies theme-aware base layout;
  // we only supply overrides specific to heatmaps here.
  const layout: Partial<Plotly.Layout> = {
    annotations: showAnnotations ? annotations : undefined,
    xaxis: {
      tickangle: 0,
      side: "bottom" as const,
    },
    // Reverse y-axis so the first element of `y` appears at the TOP
    // (e.g. newest year at top for a year × month seasonal matrix).
    // Also override the base theme's separatethousands:true so year labels
    // like "2014" don't render as "2,014".
    yaxis: {
      autorange: "reversed" as const,
      separatethousands: false,
      tickformat: "d",  // integer — suppresses thousands comma on numeric labels
    },
    margin: { t: 10, b: 50, l: 100, r: 80 },
  };

  return (
    <PlotlyChart
      data={[trace]}
      layout={layout}
      title={title}
      subtitle={subtitle}
      source={source}
      sourceUrl={sourceUrl}
      height={height}
    />
  );
}
