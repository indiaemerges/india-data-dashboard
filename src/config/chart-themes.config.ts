// Plotly layout theme shared across all charts
import { CHART_COLORWAY, CHART_COLORWAY_DARK } from "@/lib/utils/colors";

export const defaultLayout: Partial<Plotly.Layout> = {
  font: {
    family: "Inter, system-ui, -apple-system, sans-serif",
    size: 13,
    color: "#374151",
  },
  colorway: CHART_COLORWAY,
  paper_bgcolor: "transparent",
  plot_bgcolor: "transparent",
  // b: 100 gives enough room for angled x-axis tick labels + the horizontal
  // legend below them without overlap on both desktop and mobile viewports.
  margin: { l: 60, r: 20, t: 50, b: 100 },
  xaxis: {
    gridcolor: "#E5E7EB",
    linecolor: "#D1D5DB",
    tickfont: { size: 11 },
  },
  yaxis: {
    gridcolor: "#E5E7EB",
    linecolor: "#D1D5DB",
    tickfont: { size: 11 },
    separatethousands: true,
  },
  legend: {
    orientation: "h",
    yanchor: "top",
    // y: -0.2 places the legend just below the x-axis in the b:100 margin zone,
    // clear of angled tick labels on all screen sizes.
    y: -0.2,
    xanchor: "center",
    x: 0.5,
    font: { size: 11 },
    // Wrap long legend items rather than overflowing off-screen on mobile
    tracegroupgap: 4,
  },
  hoverlabel: {
    bgcolor: "#1F2937",
    font: { color: "#FFFFFF", size: 12 },
    bordercolor: "#1F2937",
  },
  hovermode: "x unified",
};

export const defaultConfig: Partial<Plotly.Config> = {
  responsive: true,
  displaylogo: false,
  modeBarButtonsToRemove: [
    "lasso2d",
    "select2d",
    "autoScale2d",
  ] as Plotly.ModeBarDefaultButtons[],
  toImageButtonOptions: {
    format: "png",
    filename: "india-data-chart",
    height: 600,
    width: 1000,
    scale: 2,
  },
};

// Dark mode theme override — uses CHART_COLORWAY_DARK so near-black colours
// (navy, dark green, purple) are replaced with bright equivalents legible on
// a dark background. All other layout settings are inherited from defaultLayout.
export const darkLayout: Partial<Plotly.Layout> = {
  ...defaultLayout,
  colorway: CHART_COLORWAY_DARK,
  font: {
    ...defaultLayout.font,
    color: "#E5E7EB",
  },
  paper_bgcolor: "transparent",
  plot_bgcolor: "transparent",
  xaxis: {
    gridcolor: "#374151",
    linecolor: "#4B5563",
    tickfont: { size: 11, color: "#9CA3AF" },
  },
  yaxis: {
    gridcolor: "#374151",
    linecolor: "#4B5563",
    tickfont: { size: 11, color: "#9CA3AF" },
    separatethousands: true,
  },
  hoverlabel: {
    bgcolor: "#374151",
    font: { color: "#F9FAFB", size: 12 },
    bordercolor: "#4B5563",
  },
};
