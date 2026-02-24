/**
 * Generate static JSON for MoSPI NAS Quarterly GDP data.
 *
 * This script embeds verified data fetched from the MoSPI NAS API
 * (National Accounts Statistics, base year 2011-12, Current series,
 * frequency_code=Quarterly) to avoid CORS issues with browser requests.
 *
 * Indicators embedded:
 *   - Indicator 22: GDP Growth Rate (%, constant prices = real GDP growth)
 *   - Indicator  5: Gross Domestic Product (₹ Crore, current & constant prices)
 *
 * Writes:  public/data/mospi/nas-quarterly.json
 *
 * Run:  node scripts/generate-nas-quarterly.mjs
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "..", "public", "data", "mospi");

// ═══════════════════════════════════════════════════════════════════════
// EMBEDDED DATA — fetched live from MoSPI NAS API on 2026-02-23
// Base year: 2011-12 | Series: Current | Frequency: Quarterly
// ═══════════════════════════════════════════════════════════════════════

/**
 * GDP Growth Rate (%, constant prices = real YoY growth)
 * Indicator code 22, quarterly.
 * Fiscal year quarters: Q1=Apr-Jun, Q2=Jul-Sep, Q3=Oct-Dec, Q4=Jan-Mar
 * null = base year (no prior year to compare against)
 */
const GDP_GROWTH_RATE = [
  // 2025-26
  { year: "2025-26", quarter: "Q1", real: 7.811473796,  nominal: 8.819924796 },
  { year: "2025-26", quarter: "Q2", real: 8.228474104,  nominal: 8.733345698 },
  // 2024-25
  { year: "2024-25", quarter: "Q1", real: 6.511799767,  nominal: 9.654775534 },
  { year: "2024-25", quarter: "Q2", real: 5.612025035,  nominal: 8.281632949 },
  { year: "2024-25", quarter: "Q3", real: 6.366485562,  nominal: 10.281984002 },
  { year: "2024-25", quarter: "Q4", real: 7.384530362,  nominal: 10.759604865 },
  // 2023-24
  { year: "2023-24", quarter: "Q1", real: 9.659944251,  nominal: 10.950464661 },
  { year: "2023-24", quarter: "Q2", real: 9.342884696,  nominal: 12.119378656 },
  { year: "2023-24", quarter: "Q3", real: 9.514554744,  nominal: 12.920677260 },
  { year: "2023-24", quarter: "Q4", real: 8.354640581,  nominal: 12.046110758 },
  // 2022-23
  { year: "2022-23", quarter: "Q1", real: 13.490759580, nominal: 25.524316556 },
  { year: "2022-23", quarter: "Q2", real: 5.958237526,  nominal: 14.762105847 },
  { year: "2022-23", quarter: "Q3", real: 4.844051198,  nominal: 8.920763095 },
  { year: "2022-23", quarter: "Q4", real: 6.896953970,  nominal: 8.913636071 },
  // 2021-22
  { year: "2021-22", quarter: "Q1", real: 22.633772591, nominal: 32.980134027 },
  { year: "2021-22", quarter: "Q2", real: 9.865857685,  nominal: 19.013954449 },
  { year: "2021-22", quarter: "Q3", real: 5.529074978,  nominal: 14.507251402 },
  { year: "2021-22", quarter: "Q4", real: 4.452845566,  nominal: 13.302010949 },
  // 2020-21 (COVID year — large contractions)
  { year: "2020-21", quarter: "Q1", real: -23.134128851, nominal: -21.356391965 },
  { year: "2020-21", quarter: "Q2", real: -5.839217619,  nominal: -2.872880542 },
  { year: "2020-21", quarter: "Q3", real: 1.775082226,   nominal: 6.597935468 },
  { year: "2020-21", quarter: "Q4", real: 3.289792797,   nominal: 11.827530694 },
  // 2019-20
  { year: "2019-20", quarter: "Q1", real: 5.095368273,  nominal: 8.360218506 },
  { year: "2019-20", quarter: "Q2", real: 4.298371249,  nominal: 4.555825956 },
  { year: "2019-20", quarter: "Q3", real: 3.255643068,  nominal: 5.383673244 },
  { year: "2019-20", quarter: "Q4", real: 2.944913061,  nominal: 7.236581545 },
  // 2018-19
  { year: "2018-19", quarter: "Q1", real: 7.499660631,  nominal: 13.980167124 },
  { year: "2018-19", quarter: "Q2", real: 6.457181176,  nominal: 11.997621059 },
  { year: "2018-19", quarter: "Q3", real: 6.233478045,  nominal: 12.301936084 },
  { year: "2018-19", quarter: "Q4", real: 5.720942784,  nominal: 4.724379927 },
  // 2017-18
  { year: "2017-18", quarter: "Q1", real: 6.112753448,  nominal: 10.141876867 },
  { year: "2017-18", quarter: "Q2", real: 5.317939559,  nominal: 10.738387281 },
  { year: "2017-18", quarter: "Q3", real: 6.668677787,  nominal: 11.978941443 },
  { year: "2017-18", quarter: "Q4", real: 8.932909215,  nominal: 11.204004837 },
  // 2016-17
  { year: "2016-17", quarter: "Q1", real: 8.679542613,  nominal: 12.215736681 },
  { year: "2016-17", quarter: "Q2", real: 9.668830845,  nominal: 11.865751964 },
  { year: "2016-17", quarter: "Q3", real: 8.576357397,  nominal: 11.459444424 },
  { year: "2016-17", quarter: "Q4", real: 6.289654045,  nominal: 11.552762470 },
  // 2015-16
  { year: "2015-16", quarter: "Q1", real: 7.592544704,  nominal: 11.293950826 },
  { year: "2015-16", quarter: "Q2", real: 8.033805912,  nominal: 9.885532713 },
  { year: "2015-16", quarter: "Q3", real: 7.197432472,  nominal: 9.159277908 },
  { year: "2015-16", quarter: "Q4", real: 9.088682634,  nominal: 11.498797397 },
  // 2014-15
  { year: "2014-15", quarter: "Q1", real: 8.023963019,  nominal: 13.604983839 },
  { year: "2014-15", quarter: "Q2", real: 8.704109170,  nominal: 13.691399138 },
  { year: "2014-15", quarter: "Q3", real: 5.922736184,  nominal: 9.032546817 },
  { year: "2014-15", quarter: "Q4", real: 7.112162334,  nominal: 8.291509385 },
  // 2013-14
  { year: "2013-14", quarter: "Q1", real: 6.447098628,  nominal: 10.901392663 },
  { year: "2013-14", quarter: "Q2", real: 7.337748749,  nominal: 13.969303271 },
  { year: "2013-14", quarter: "Q3", real: 6.534982613,  nominal: 14.624684528 },
  { year: "2013-14", quarter: "Q4", real: 5.342899071,  nominal: 12.305918972 },
  // 2012-13
  { year: "2012-13", quarter: "Q1", real: 4.867679535,  nominal: 13.198301502 },
  { year: "2012-13", quarter: "Q2", real: 7.493168845,  nominal: 16.136441756 },
  { year: "2012-13", quarter: "Q3", real: 5.376391669,  nominal: 13.520961134 },
  { year: "2012-13", quarter: "Q4", real: 4.296010406,  nominal: 12.692428128 },
  // 2011-12 (base year — growth rate not available)
  { year: "2011-12", quarter: "Q1", real: null, nominal: null },
  { year: "2011-12", quarter: "Q2", real: null, nominal: null },
  { year: "2011-12", quarter: "Q3", real: null, nominal: null },
  { year: "2011-12", quarter: "Q4", real: null, nominal: null },
];

/**
 * Gross Domestic Product (₹ Crore)
 * Indicator code 5, quarterly.
 * current_price = nominal GDP; constant_price = real GDP (base: 2011-12)
 */
const GDP_LEVELS = [
  // 2025-26
  { year: "2025-26", quarter: "Q1", currentPrice: 8605364.534,        constantPrice: 4788623.361 },
  { year: "2025-26", quarter: "Q2", currentPrice: 8525069.516,        constantPrice: 4863340.166 },
  // 2024-25
  { year: "2024-25", quarter: "Q1", currentPrice: 7907894.211498685,  constantPrice: 4441663.946155024 },
  { year: "2024-25", quarter: "Q2", currentPrice: 7840345.0766465785, constantPrice: 4493586.559883779 },
  { year: "2024-25", quarter: "Q3", currentPrice: 8502371.933570046,  constantPrice: 4726541.829827959 },
  { year: "2024-25", quarter: "Q4", currentPrice: 8817534.147293523,  constantPrice: 5135163.108031793 },
  // 2023-24
  { year: "2023-24", quarter: "Q1", currentPrice: 7211627.7407951895, constantPrice: 4170114.443535164 },
  { year: "2023-24", quarter: "Q2", currentPrice: 7240697.118385134,  constantPrice: 4254805.793562238 },
  { year: "2023-24", quarter: "Q3", currentPrice: 7709665.373284863,  constantPrice: 4443638.242661299 },
  { year: "2023-24", quarter: "Q4", currentPrice: 7960965.6950431755, constantPrice: 4782032.468479682 },
  // 2022-23
  { year: "2022-23", quarter: "Q1", currentPrice: 6499862.585397522,  constantPrice: 3802769.071241618 },
  { year: "2022-23", quarter: "Q2", currentPrice: 6458024.656568376,  constantPrice: 3891250.725085199 },
  { year: "2022-23", quarter: "Q3", currentPrice: 6827505.431539382,  constantPrice: 4057577.7831861232 },
  { year: "2022-23", quarter: "Q4", currentPrice: 7105079.900766106,  constantPrice: 4413315.796011902 },
  // 2021-22
  { year: "2021-22", quarter: "Q1", currentPrice: 5178170.065948587,  constantPrice: 3350730.125792569 },
  { year: "2021-22", quarter: "Q2", currentPrice: 5627314.52940627,   constantPrice: 3672438.13782882 },
  { year: "2021-22", quarter: "Q3", currentPrice: 6268323.171400001,  constantPrice: 3870107.780866347 },
  { year: "2021-22", quarter: "Q4", currentPrice: 6523590.761535522,  constantPrice: 4128570.209068934 },
  // 2020-21
  { year: "2020-21", quarter: "Q1", currentPrice: 3893942.583111721,  constantPrice: 2732306.1624803413 },
  { year: "2020-21", quarter: "Q2", currentPrice: 4728281.280499754,  constantPrice: 3342656.4132056986 },
  { year: "2020-21", quarter: "Q3", currentPrice: 5474171.368749541,  constantPrice: 3667337.917707657 },
  { year: "2020-21", quarter: "Q4", currentPrice: 5757700.774135975,  constantPrice: 3952568.4405267606 },
  // 2019-20
  { year: "2019-20", quarter: "Q1", currentPrice: 4951378.351529209,  constantPrice: 3554641.509463443 },
  { year: "2019-20", quarter: "Q2", currentPrice: 4868137.042351909,  constantPrice: 3549945.4536129762 },
  { year: "2019-20", quarter: "Q3", currentPrice: 5135344.643158515,  constantPrice: 3603375.0476866285 },
  { year: "2019-20", quarter: "Q4", currentPrice: 5148732.819554979,  constantPrice: 3826678.6421807245 },
  // 2018-19
  { year: "2018-19", quarter: "Q1", currentPrice: 4569369.10960454,   constantPrice: 3382300.826252723 },
  { year: "2018-19", quarter: "Q2", currentPrice: 4656017.01085801,   constantPrice: 3403644.190329838 },
  { year: "2018-19", quarter: "Q3", currentPrice: 4872998.335604323,  constantPrice: 3489760.8891947092 },
  { year: "2018-19", quarter: "Q4", currentPrice: 4801283.988518902,  constantPrice: 3717210.038242801 },
  // 2017-18
  { year: "2017-18", quarter: "Q1", currentPrice: 4008915.9587263893, constantPrice: 3146336.282723581 },
  { year: "2017-18", quarter: "Q2", currentPrice: 4157246.3475744613, constantPrice: 3197195.485297825 },
  { year: "2017-18", quarter: "Q3", currentPrice: 4339193.521977622,  constantPrice: 3284991.655580265 },
  { year: "2017-18", quarter: "Q4", currentPrice: 4584686.003245508,  constantPrice: 3516058.3516894863 },
  // 2016-17
  { year: "2016-17", quarter: "Q1", currentPrice: 3639774.6060400945, constantPrice: 2965087.777365247 },
  { year: "2016-17", quarter: "Q2", currentPrice: 3754117.027647742,  constantPrice: 3035755.825347009 },
  { year: "2016-17", quarter: "Q3", currentPrice: 3875006.7021133816, constantPrice: 3079621.613129943 },
  { year: "2016-17", quarter: "Q4", currentPrice: 4122770.6790721538, constantPrice: 3227728.311887769 },
  // 2015-16
  { year: "2015-16", quarter: "Q1", currentPrice: 3243543.361312905,  constantPrice: 2728278.584346896 },
  { year: "2015-16", quarter: "Q2", currentPrice: 3355884.42395621,   constantPrice: 2768087.099670945 },
  { year: "2015-16", quarter: "Q3", currentPrice: 3476632.468454043,  constantPrice: 2836387.3934655306 },
  { year: "2015-16", quarter: "Q4", currentPrice: 3695813.62513326,   constantPrice: 3036737.911518122 },
  // 2014-15
  { year: "2014-15", quarter: "Q1", currentPrice: 2914393.223745723,  constantPrice: 2535750.5874271104 },
  { year: "2014-15", quarter: "Q2", currentPrice: 3053982.0312102744, constantPrice: 2562241.583825141 },
  { year: "2014-15", quarter: "Q3", currentPrice: 3184917.0634663645, constantPrice: 2645947.1351727517 },
  { year: "2014-15", quarter: "Q4", currentPrice: 3314666.8048581267, constantPrice: 2783733.2326179086 },
  // 2013-14
  { year: "2013-14", quarter: "Q1", currentPrice: 2565374.445072557,  constantPrice: 2347396.370736708 },
  { year: "2013-14", quarter: "Q2", currentPrice: 2686203.225902797,  constantPrice: 2357078.8660974028 },
  { year: "2013-14", quarter: "Q3", currentPrice: 2921070.0441759545, constantPrice: 2497997.342693486 },
  { year: "2013-14", quarter: "Q4", currentPrice: 3060874.1383959404, constantPrice: 2598897.56139174 },
  // 2012-13
  { year: "2012-13", quarter: "Q1", currentPrice: 2313203.0928381416, constantPrice: 2205223.440559079 },
  { year: "2012-13", quarter: "Q2", currentPrice: 2356953.274968776,  constantPrice: 2195945.8751209346 },
  { year: "2012-13", quarter: "Q3", currentPrice: 2548377.826465527,  constantPrice: 2344767.213001712 },
  { year: "2012-13", quarter: "Q4", currentPrice: 2725478.911893716,  constantPrice: 2467081.8672380485 },
  // 2011-12 (base year)
  { year: "2011-12", quarter: "Q1", currentPrice: 2043496.29115249,   constantPrice: 2102862.8175453534 },
  { year: "2011-12", quarter: "Q2", currentPrice: 2029469.1651718912, constantPrice: 2042870.1644094647 },
  { year: "2011-12", quarter: "Q3", currentPrice: 2244852.229057348,  constantPrice: 2225135.2279735506 },
  { year: "2011-12", quarter: "Q4", currentPrice: 2418511.1255092896, constantPrice: 2365461.3993782615 },
];

// ═══════════════════════════════════════════════════════════════════════
// Transform: build the output JSON structure
// ═══════════════════════════════════════════════════════════════════════

/**
 * Convert the flat arrays into a time-ordered array of quarter records,
 * stripping null growth rows (base year). Oldest first so charts render
 * left-to-right chronologically.
 */
function buildOutput() {
  // Build a map of levels keyed by "year|quarter" for O(1) lookup
  const levelMap = new Map();
  for (const row of GDP_LEVELS) {
    levelMap.set(`${row.year}|${row.quarter}`, row);
  }

  // Merge growth rates with levels, filter out base year nulls for growth
  const quarters = [];
  // Sort chronologically: oldest year first, and within each year Q1→Q4
  const QUARTER_NUM = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };
  const ordered = [...GDP_GROWTH_RATE].sort((a, b) => {
    if (a.year < b.year) return -1;
    if (a.year > b.year) return 1;
    return QUARTER_NUM[a.quarter] - QUARTER_NUM[b.quarter];
  });

  for (const g of ordered) {
    const key = `${g.year}|${g.quarter}`;
    const level = levelMap.get(key);
    quarters.push({
      year: g.year,
      quarter: g.quarter,
      // Human-readable label, e.g. "2024-25 Q1"
      label: `${g.year} ${g.quarter}`,
      // Growth rates (%)
      realGrowth: g.real,    // YoY real GDP growth rate
      nominalGrowth: g.nominal, // YoY nominal GDP growth rate
      // Absolute GDP levels (₹ Crore)
      nominalGDP: level ? Math.round(level.currentPrice) : null,
      realGDP: level ? Math.round(level.constantPrice) : null,
    });
  }

  return {
    lastUpdated: "2026-02-23",
    source: "MoSPI National Accounts Statistics (NAS)",
    sourceUrl: "https://www.mospi.gov.in/",
    baseYear: "2011-12",
    unit: "₹ Crore",
    notes:
      "Quarterly GDP at current prices (nominal) and constant 2011-12 prices (real). " +
      "Q1=Apr-Jun, Q2=Jul-Sep, Q3=Oct-Dec, Q4=Jan-Mar. " +
      "Growth rates are year-on-year (same quarter of prior fiscal year). " +
      "Data sourced from MoSPI NAS API, indicator codes 5 (GDP) and 22 (GDP Growth Rate), " +
      "Current series, base year 2011-12.",
    quarters,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// Write output
// ═══════════════════════════════════════════════════════════════════════

if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

const output = buildOutput();
const outputPath = join(OUTPUT_DIR, "nas-quarterly.json");
writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf-8");

console.log(`✅  Written ${output.quarters.length} quarters to ${outputPath}`);
console.log(
  `    Coverage: ${output.quarters[0].label} → ${output.quarters[output.quarters.length - 1].label}`
);
const latest = output.quarters[output.quarters.length - 1];
console.log(
  `    Latest real GDP growth: ${latest.realGrowth?.toFixed(2)}% (${latest.label})`
);
