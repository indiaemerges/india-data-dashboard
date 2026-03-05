/**
 * SeriesFilterChart — LineChart with an inline series toggle strip.
 *
 * Renders a row of color-coded chip buttons above the chart so the user can
 * show/hide individual series. At least one series is always kept visible
 * (the last one cannot be deselected). A "Show all" link appears whenever any
 * series is hidden.
 *
 * Drop-in replacement for LineChart: accepts identical props plus an optional
 * `defaultHidden` list of indicatorId values to pre-hide on first render.
 */

import { useState } from "react";
import LineChart from "./LineChart";
import type { DataSeries } from "@/lib/api/types";

// ── Plotly default color cycle (matches line colours in the chart) ─────────
const PLOTLY_COLORS = [
  "#636EFA", "#EF553B", "#00CC96", "#AB63FA", "#FFA15A",
  "#19D3F3", "#FF6692", "#B6E880", "#FF97FF", "#FECB52",
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface SeriesFilterChartProps {
  series: DataSeries[];
  /** indicatorIds (or indicator names) to hide on first render */
  defaultHidden?: string[];
  title?: string;
  subtitle?: string;
  source?: string;
  sourceUrl?: string;
  showMarkers?: boolean;
  yAxisTitle?: string;
  height?: number;
  lineShape?: "linear" | "spline" | "hv" | "vh" | "hvh" | "vhv";
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Stable key for a series — prefer indicatorId, fall back to indicator name */
function seriesKey(s: DataSeries): string {
  return s.indicatorId ?? s.indicator;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SeriesFilterChart({
  series,
  defaultHidden = [],
  ...chartProps
}: SeriesFilterChartProps) {
  const [visibleIds, setVisibleIds] = useState<Set<string>>(
    () => new Set(series.map(seriesKey).filter((k) => !defaultHidden.includes(k)))
  );

  // ── Handlers ────────────────────────────────────────────────────────────────

  function toggle(key: string) {
    setVisibleIds((prev) => {
      // Don't allow deselecting the last visible series
      if (prev.has(key) && prev.size === 1) return prev;
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function showAll() {
    setVisibleIds(new Set(series.map(seriesKey)));
  }

  // ── Derived ─────────────────────────────────────────────────────────────────

  // Stamp each series with its designated colour so LineChart uses the same
  // colour regardless of how many series are hidden (Plotly's auto-cycle would
  // otherwise reassign colours by position in the filtered subset).
  const coloredSeries = series.map((s, i) => ({
    ...s,
    color: PLOTLY_COLORS[i % PLOTLY_COLORS.length],
  }));

  const allVisible  = visibleIds.size === series.length;
  const filtered    = coloredSeries.filter((s) => visibleIds.has(seriesKey(s)));

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* ── Series toggle chips ── */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2 px-1">
        {series.map((s, i) => {
          const key    = seriesKey(s);
          const active = visibleIds.has(key);
          const color  = PLOTLY_COLORS[i % PLOTLY_COLORS.length];

          return (
            <button
              key={key}
              onClick={() => toggle(key)}
              title={active ? `Hide ${s.indicator}` : `Show ${s.indicator}`}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                active
                  ? "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 opacity-100"
                  : "bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 opacity-60"
              }`}
            >
              {/* Colour swatch dot */}
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 transition-colors"
                style={{ backgroundColor: active ? color : "#9CA3AF" }}
              />
              <span className={active ? "" : "line-through"}>
                {s.indicator}
              </span>
            </button>
          );
        })}

        {/* "Show all" appears only when something is hidden */}
        {!allVisible && (
          <button
            onClick={showAll}
            className="text-xs text-orange-500 hover:text-orange-600 dark:hover:text-orange-400 underline ml-1 transition-colors"
          >
            Show all
          </button>
        )}
      </div>

      {/* ── Chart ── */}
      <LineChart series={filtered} {...chartProps} />
    </div>
  );
}
