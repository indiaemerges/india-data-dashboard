// India-inspired color palettes for consistent chart theming

// Primary palette - inspired by the Indian flag and national colors
export const INDIA_COLORS = {
  saffron: "#FF9933",
  green: "#138808",
  navy: "#000080",
  white: "#FFFFFF",
};

// Extended chart color palette for multiple data series (light mode)
export const CHART_COLORWAY = [
  "#FF9933", // Saffron
  "#138808", // India Green
  "#000080", // Navy Blue
  "#4A90D9", // Sky Blue
  "#E74C3C", // Red
  "#2ECC71", // Emerald
  "#9B59B6", // Purple
  "#F39C12", // Orange
  "#1ABC9C", // Teal
  "#E67E22", // Carrot
  "#3498DB", // Peter Blue
  "#E91E63", // Pink
];

// Dark-mode chart colorway — same order, but dark/near-black colours replaced
// with bright equivalents that are legible on a dark (#1F2937) background:
//   #000080 Navy    → #22D3EE Cyan      (position 3)
//   #138808 Green   → #4ADE80 Lime      (position 2, original is too dark)
//   #9B59B6 Purple  → #C084FC Lavender  (position 7, brightened)
export const CHART_COLORWAY_DARK = [
  "#FF9933", // Saffron        (unchanged)
  "#4ADE80", // Lime Green     (was #138808 — too dark on dark bg)
  "#22D3EE", // Cyan           (was #000080 — invisible on dark bg)
  "#60A5FA", // Sky Blue       (was #4A90D9 — slightly brighter)
  "#F87171", // Soft Red       (was #E74C3C — slightly softened)
  "#34D399", // Emerald        (unchanged, already bright)
  "#C084FC", // Lavender       (was #9B59B6 — brightened)
  "#FBBF24", // Amber          (was #F39C12 — slightly brighter)
  "#2DD4BF", // Teal           (unchanged)
  "#FB923C", // Carrot         (was #E67E22 — slightly brighter)
  "#38BDF8", // Azure          (was #3498DB — brightened)
  "#F472B6", // Pink           (was #E91E63 — brightened)
];

// Sequential palette for maps and heatmaps
export const SEQUENTIAL_PALETTE = {
  oranges: [
    "#FFF5EB",
    "#FEE6CE",
    "#FDD0A2",
    "#FDAE6B",
    "#FD8D3C",
    "#F16913",
    "#D94801",
    "#8C2D04",
  ],
  greens: [
    "#F7FCF5",
    "#E5F5E0",
    "#C7E9C0",
    "#A1D99B",
    "#74C476",
    "#41AB5D",
    "#238B45",
    "#005A32",
  ],
  blues: [
    "#F7FBFF",
    "#DEEBF7",
    "#C6DBEF",
    "#9ECAE1",
    "#6BAED6",
    "#4292C6",
    "#2171B5",
    "#084594",
  ],
};

// Category colors for sectors
export const SECTOR_COLORS: Record<string, string> = {
  agriculture: "#138808",
  industry: "#FF9933",
  services: "#4A90D9",
  manufacturing: "#E74C3C",
  mining: "#8C2D04",
  construction: "#F39C12",
  electricity: "#F1C40F",
  trade: "#2ECC71",
  transport: "#9B59B6",
  finance: "#000080",
};

// Energy-specific colors for Sankey diagrams
export const ENERGY_COLORS: Record<string, string> = {
  coal: "#4a4a4a",
  oil: "#8B4513",
  gas: "#87CEEB",
  nuclear: "#FF6347",
  hydro: "#4682B4",
  solar: "#FFD700",
  wind: "#98FB98",
  biomass: "#228B22",
  electricity: "#F1C40F",
  industry: "#FF9933",
  transport: "#9B59B6",
  residential: "#2ECC71",
  commercial: "#3498DB",
};
