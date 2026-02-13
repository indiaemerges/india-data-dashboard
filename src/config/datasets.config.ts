// Master catalog of all available datasets and dashboards

export interface DatasetEntry {
  id: string; // URL slug
  title: string;
  description: string;
  source: string;
  sourceUrl: string;
  dataType: "live-api" | "static-json" | "hybrid";
  updateFrequency: string;
  tags: string[];
  chartTypes: string[];
  dashboardPath: string;
  icon: string; // Emoji icon for display
  category: "economy" | "industry" | "energy" | "demographics" | "prices";
}

export const datasets: DatasetEntry[] = [
  {
    id: "gdp-growth",
    title: "GDP & National Accounts",
    description:
      "GDP, GVA, consumption, investment, trade, national income, and savings from MoSPI NAS and World Bank.",
    source: "MoSPI NAS + World Bank",
    sourceUrl: "https://www.mospi.gov.in/",
    dataType: "hybrid",
    updateFrequency: "Quarterly",
    tags: ["economy", "gdp", "growth", "macro", "gva", "national income"],
    chartTypes: ["line", "bar", "treemap"],
    dashboardPath: "/dashboards/gdp-growth",
    icon: "📈",
    category: "economy",
  },
  {
    id: "inflation",
    title: "Inflation (CPI & WPI)",
    description:
      "Consumer and Wholesale Price Indices across 600+ items. State-level CPI and commodity-level WPI.",
    source: "MoSPI CPI + WPI",
    sourceUrl: "https://www.mospi.gov.in/",
    dataType: "live-api",
    updateFrequency: "Monthly",
    tags: ["prices", "inflation", "cpi", "wpi", "cost of living"],
    chartTypes: ["line", "bar", "treemap"],
    dashboardPath: "/dashboards/inflation",
    icon: "💰",
    category: "prices",
  },
  {
    id: "employment",
    title: "Employment & Labour (PLFS)",
    description:
      "Unemployment rate, LFPR, WPR, wages, and worker distribution from the Periodic Labour Force Survey.",
    source: "MoSPI PLFS",
    sourceUrl: "https://www.mospi.gov.in/",
    dataType: "live-api",
    updateFrequency: "Quarterly",
    tags: ["jobs", "unemployment", "wages", "labour", "workforce"],
    chartTypes: ["line", "bar", "map"],
    dashboardPath: "/dashboards/employment",
    icon: "👷",
    category: "economy",
  },
  {
    id: "industrial",
    title: "Industrial Production (IIP & ASI)",
    description:
      "Index of Industrial Production and 57 factory-sector indicators from Annual Survey of Industries.",
    source: "MoSPI IIP + ASI",
    sourceUrl: "https://www.mospi.gov.in/",
    dataType: "live-api",
    updateFrequency: "Monthly (IIP) / Annual (ASI)",
    tags: ["industry", "manufacturing", "production", "factory"],
    chartTypes: ["line", "bar"],
    dashboardPath: "/dashboards/industrial",
    icon: "🏭",
    category: "industry",
  },
  {
    id: "energy-flow",
    title: "Energy Balance & Flows",
    description:
      "India's energy balance as Sankey diagrams — production, transformation, and end-use across all fuels.",
    source: "MoSPI Energy Statistics",
    sourceUrl: "https://www.mospi.gov.in/",
    dataType: "hybrid",
    updateFrequency: "Annual",
    tags: ["energy", "coal", "oil", "gas", "renewables", "electricity"],
    chartTypes: ["sankey", "bar", "treemap"],
    dashboardPath: "/dashboards/energy-flow",
    icon: "⚡",
    category: "energy",
  },
  {
    id: "population",
    title: "Population & Demographics",
    description:
      "Census 2011 demographics — population, literacy, urbanization, household amenities by state and district.",
    source: "Census of India",
    sourceUrl: "https://censusindia.gov.in/",
    dataType: "hybrid",
    updateFrequency: "Decennial",
    tags: ["population", "census", "demographics", "literacy", "urbanization"],
    chartTypes: ["map", "bar", "treemap"],
    dashboardPath: "/dashboards/population",
    icon: "👥",
    category: "demographics",
  },
  {
    id: "trade",
    title: "International Trade",
    description:
      "India's exports, imports, trade balance, and trading partners from World Bank and NAS data.",
    source: "World Bank + MoSPI NAS",
    sourceUrl: "https://data.worldbank.org/country/india",
    dataType: "live-api",
    updateFrequency: "Annual",
    tags: ["trade", "exports", "imports", "balance of trade", "fdi"],
    chartTypes: ["line", "bar"],
    dashboardPath: "/dashboards/trade",
    icon: "🚢",
    category: "economy",
  },
  {
    id: "petroleum",
    title: "Petroleum & Refining",
    description:
      "Petroleum production, refinery throughput, and consumption data from PPAC.",
    source: "PPAC",
    sourceUrl: "https://ppac.gov.in/",
    dataType: "static-json",
    updateFrequency: "Monthly",
    tags: ["petroleum", "oil", "refinery", "fuel"],
    chartTypes: ["line", "bar"],
    dashboardPath: "/dashboards/petroleum",
    icon: "🛢️",
    category: "energy",
  },
  {
    id: "rbi-monetary",
    title: "RBI Monetary Policy",
    description:
      "Key policy rates, forex reserves, monetary aggregates, and banking statistics from Reserve Bank of India.",
    source: "RBI DBIE",
    sourceUrl: "https://dbie.rbi.org.in/",
    dataType: "static-json",
    updateFrequency: "Monthly",
    tags: ["rbi", "interest rates", "forex", "monetary policy", "banking"],
    chartTypes: ["line", "bar"],
    dashboardPath: "/dashboards/rbi-monetary",
    icon: "🏦",
    category: "economy",
  },
];

// Group datasets by category
export const datasetsByCategory = datasets.reduce(
  (acc, dataset) => {
    if (!acc[dataset.category]) {
      acc[dataset.category] = [];
    }
    acc[dataset.category].push(dataset);
    return acc;
  },
  {} as Record<string, DatasetEntry[]>
);

// Category display names
export const categoryLabels: Record<string, string> = {
  economy: "Economy & Finance",
  industry: "Industry & Manufacturing",
  energy: "Energy & Resources",
  demographics: "Demographics & Society",
  prices: "Prices & Inflation",
};
