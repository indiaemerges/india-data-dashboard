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
   */
  colorscale?: Plotly.ColorScale;
  /**
   * The value that maps to the centre of the color scale.
   * For CPI, use 4 (RBI's inflation target). For growth-rate data, use 0.
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

  // ── Plotly heatmap trace ──────────────────────────────────────────────────
  const trace: Plotly.Data = {
    type: "heatmap",
    x,
    y,
    z,
    colorscale,
    ...(zmid !== undefined ? { zmid } : {}),
    ...(zmin !== undefined ? { zmin } : {}),
    ...(zmax !== undefined ? { zmax } : {}),
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

  // ── Optional cell annotations ─────────────────────────────────────────────
  const annotations: Partial<Plotly.Annotations>[] = showAnnotations
    ? y.flatMap((rowLabel, ri) =>
        x.map((colLabel, ci) => {
          const val = z[ri]?.[ci];
          return {
            x: colLabel,
            y: rowLabel,
            text: val != null ? fmt(val) : "",
            showarrow: false,
            font: { size: 9, color: "#1f2937" },
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
    yaxis: {
      autorange: "reversed" as const,
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
