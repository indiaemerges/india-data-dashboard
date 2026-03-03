# India Data Dashboard — Expansion Roadmap

> Last updated: 2026-03-03
> Current state: 10 dashboards live (GDP, Inflation, Employment, Industrial, Energy Flow,
> Population, Trade, Petroleum, RBI Monetary). Data Explorer placeholder exists at /explore.

---

## Phase 1 — Enhance Existing Dashboards
*Uses current MoSPI MCP + existing infrastructure. No new data sourcing needed.*

### 1a. IIP Monthly ✅ TODO
- **What**: Switch Industrial dashboard from annual to monthly IIP data
- **Why**: IIP is a monthly indicator — annual averages hide recessions, COVID shock, cycles
- **How**:
  - Query MoSPI IIP API with monthly frequency via MCP
  - Write `scripts/generate-iip-monthly.mjs` → `public/data/mospi/iip-monthly.json`
  - Add `IIPMonthlyData` type to `types.ts`
  - Add `useMospiIIPMonthly()` hook to `useMospiIIP.ts`
  - Update `dashboards/industrial.tsx` to show monthly trend + 3/12-month moving average
- **Files touched**: scripts/, public/data/mospi/, types.ts, useMospiIIP.ts, industrial.tsx

### 1b. CPI Heatmap ✅ TODO
- **What**: Add a month×year heatmap to the Inflation dashboard
- **Why**: Instantly reveals seasonality (vegetables, fruits spike predictably each year)
- **How**:
  - New `HeatmapChart.tsx` component wrapping Plotly heatmap trace
  - Use existing `cpi-monthly.json` data (already has monthly data back to 2014)
  - X-axis: calendar months (Jan–Dec), Y-axis: years, Color: YoY % change
  - Add as a 5th chart tab on `dashboards/inflation.tsx`
- **Files touched**: components/charts/HeatmapChart.tsx (new), inflation.tsx

### 1c. PLFS Quarterly ✅ TODO
- **What**: Add quarterly unemployment trend to Employment dashboard
- **Why**: PLFS quarterly bulletin (frequency_code=2) gives more granular picture than annual
- **How**:
  - Query MoSPI PLFS with frequency_code=2 via MCP
  - Write `scripts/generate-plfs-quarterly.mjs` → `public/data/mospi/plfs-quarterly.json`
  - Add hook + update `dashboards/employment.tsx`
- **Files touched**: scripts/, public/data/mospi/, useMospiPLFS.ts, employment.tsx

---

## Phase 2 — New Dashboards from Existing APIs
*MoSPI MCP + World Bank. No new data sourcing needed.*

### 2a. ASI Manufacturing Dashboard ✅ TODO
- **What**: New dashboard using MoSPI Annual Survey of Industries (57 indicators, currently unused)
- **Key metrics**: GVA by NIC industry group, fixed capital, wages & salaries, factory count,
  capital intensity (fixed capital / worker), labour productivity (GVA / worker)
- **How**:
  - Explore ASI indicators via MCP (get_indicators + get_metadata)
  - Write `scripts/generate-asi.mjs` → `public/data/mospi/asi-annual.json`
  - New dashboard page `dashboards/manufacturing.tsx`
  - Add to `datasets.config.ts` and sidebar
- **Files touched**: scripts/, public/data/mospi/, types.ts, hooks/useMospiASI.ts (new),
  dashboards/manufacturing.tsx (new), datasets.config.ts, Sidebar.tsx

### 2b. Human Development Dashboard ✅ TODO
- **What**: Health, education, gender, poverty indicators from World Bank WDI
- **Key metrics**:
  - Education: literacy rate, gross enrolment ratio (primary/secondary/tertiary)
  - Health: life expectancy, infant mortality rate, maternal mortality, immunisation %
  - Gender: female LFPR, gender parity index, female literacy
  - Poverty: headcount ratio at $2.15/day, Gini coefficient
- **How**: All World Bank live API — just new page + hooks
- **Files touched**: dashboards/human-development.tsx (new), datasets.config.ts, Sidebar.tsx

### 2c. Environment & Climate Dashboard ✅ TODO
- **What**: Emissions, renewable energy, forests, clean water from World Bank WDI
- **Key metrics**:
  - CO₂ emissions (total Mt, per capita, per GDP)
  - Renewable energy (% of total energy, % of electricity)
  - Forest area (% of land, absolute km²)
  - Access to clean water and sanitation (% of population)
- **How**: All World Bank live API — just new page + hooks
- **Files touched**: dashboards/environment.tsx (new), datasets.config.ts, Sidebar.tsx

---

## Phase 3 — Data Explorer
*Replaces the existing placeholder at `/explore`.*

### 3a. Explorer v1 — MoSPI + World Bank
- **What**: Free-form indicator browser and visualiser
- **Features**:
  - Source selector: MoSPI (7 datasets) or World Bank
  - MoSPI flow: dataset → indicator (from MCP get_indicators) → filters (from get_metadata) → chart
  - World Bank flow: search box → indicator list → chart
  - Chart type picker: line / bar / area
  - Download as CSV button
- **Files touched**: pages/explore/index.tsx (rewrite), components/explorer/ (new folder)

### 3b. Explorer v2 — Cross-source comparison
- **What**: Dual-axis chart comparing any two indicators from any source
- **Features**: Scatter/bubble chart mode, overlay policy events (repo rate changes) on any chart
- **Files touched**: pages/explore/index.tsx, components/charts/ScatterChart.tsx (new)

---

## Phase 4 — Choropleth Maps (State Level)
*Requires new map component + India GeoJSON + state-level data compilation.*

### 4a. Map Component
- **What**: New `ChoroplethMap.tsx` using Plotly choropleth or react-simple-maps
- **GeoJSON**: India states TopoJSON (from datameet/maps or similar open source)
- **Interaction**: Click state → detail panel; metric selector dropdown

### 4b. State Data
- **Census 2021**: literacy rate, sex ratio, population density, urbanisation % by state
- **PLFS state-level**: unemployment rate by state (available in quarterly bulletin)
- **State GSDP**: MoSPI publishes state-level GDP — static JSON compilation needed
- **Source**: static JSON `public/data/states/`

### 4c. States Dashboard
- **What**: New top-level page `/states` with choropleth + state comparison
- **Files touched**: components/charts/ChoroplethMap.tsx (new), pages/states/index.tsx (new),
  public/data/states/ (new), Sidebar.tsx

---

## Phase 5 — New Data Sources (Static JSON)
*Manual data compilation, no public API. Same approach as RBI policy-rates.json.*

### 5a. Fiscal Policy Dashboard
- **Source**: CGA (Controller General of Accounts), Union Budget documents
- **Key metrics**: Revenue receipts, capital expenditure, fiscal deficit (% GDP),
  tax revenue (direct/indirect split), GST monthly collections
- **Files**: scripts/generate-fiscal.mjs, public/data/fiscal/, dashboards/fiscal.tsx (new)

### 5b. Banking & Credit Dashboard
- **Source**: RBI DBIE (manual static JSON, same approach as policy-rates.json)
- **Key metrics**: Bank credit growth by sector (agriculture/industry/services/personal),
  NPA ratio, credit-to-GDP, deposit growth, financial inclusion
- **Files**: scripts/generate-banking.mjs, public/data/rbi/banking.json, dashboards/banking.tsx (new)

### 5c. Agriculture Dashboard
- **Source**: Ministry of Agriculture, FCI, IMD
- **Key metrics**: Kharif/rabi crop production by crop, MSP trends, foodgrain stocks, rainfall
- **Files**: scripts/generate-agriculture.mjs, public/data/agriculture/, dashboards/agriculture.tsx (new)

---

## New Chart Types Needed

| Component | Used in Phase | Plotly trace type |
|-----------|--------------|-------------------|
| `HeatmapChart.tsx` | 1b (CPI seasonality) | `heatmap` |
| `ScatterChart.tsx` | 3b (Explorer cross-indicator) | `scatter` with mode=markers |
| `ChoroplethMap.tsx` | 4 (States) | `choropleth` |
| Treemap (extend BarChart?) | 2a (ASI breakdown) | `treemap` |

---

## Sidebar Additions Needed

Current sections: Economy, Prices, Industry, Energy, Demographics

Planned new entries:
- **Industry**: + Manufacturing (ASI) [Phase 2a]
- **Economy**: + Human Development [Phase 2b], + Fiscal Policy [Phase 5a], + Banking [Phase 5b]
- **Environment** (new section): Environment & Climate [Phase 2c]
- **Agriculture** (new section): Agriculture [Phase 5c]
- **States** (new top-level): Choropleth dashboard [Phase 4]

---

## Implementation Order

```
START HERE:
  Phase 1a — IIP Monthly          (high value, low effort)
  Phase 1b — CPI Heatmap          (new chart type, self-contained)
  Phase 1c — PLFS Quarterly       (straightforward data upgrade)

NEXT:
  Phase 2a — ASI Dashboard        (new MoSPI dataset, rich data)
  Phase 2b — Human Development    (World Bank live API, easy)
  Phase 2c — Environment          (World Bank live API, easy)

THEN:
  Phase 3a — Data Explorer v1     (medium complexity UI)
  Phase 3b — Data Explorer v2     (cross-source, harder)

LATER:
  Phase 4  — Choropleth Maps      (new component + data sourcing)
  Phase 5  — New data sources     (manual compilation)
```
