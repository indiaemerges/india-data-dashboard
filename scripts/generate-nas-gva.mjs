/**
 * Generate static JSON for MoSPI NAS Quarterly GVA by Sector.
 *
 * Source: MoSPI NAS API, indicator 21 (GVA Growth Rate), quarterly,
 * base year 2011-12, Current series — fetched 2026-02-23.
 *
 * Sectors stored (raw, 8 sectors + Total):
 *   Agriculture | Mining | Manufacturing | Electricity | Construction
 *   Trade/Hotels/Transport | Finance/RE | Public Admin | Total GVA
 *
 * Output also contains three aggregated broad sectors:
 *   - Agriculture  = Agriculture only
 *   - Industry     = Mining + Manufacturing + Electricity + Construction
 *   - Services     = Trade/Hotels/Transport + Finance/RE + Public Admin
 *
 * Note: Broad sector aggregates are simple averages of the constituent sub-sector
 * growth rates (not weighted). This is an approximation — true weighted aggregates
 * would require GVA level data, which is available but kept out of scope here for
 * simplicity. For policy analysis use the Total GVA series.
 *
 * Writes: public/data/mospi/nas-gva-sectors.json
 * Run:    node scripts/generate-nas-gva.mjs
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "..", "public", "data", "mospi");

// ═══════════════════════════════════════════════════════════════════════
// EMBEDDED DATA — MoSPI NAS API, indicator 21, quarterly, 2011-12 base
// Fetched 2026-02-23. real = constant_price (YoY growth %)
// 2011-12 values are null (base year, no prior year to compare against)
// ═══════════════════════════════════════════════════════════════════════

const RAW = {
  agriculture: [
    // 2011-12 base year
    null,null,null,null,
    // 2012-13
    1.514,1.965,1.015,1.738,
    // 2013-14
    3.883,5.468,6.583,5.797,
    // 2014-15
    2.314,3.500,-3.053,-1.256,
    // 2015-16
    2.377,2.775,-2.169,1.151,
    // 2016-17
    4.939,6.161,7.359,8.205,
    // 2017-18
    6.089,6.792,5.830,7.837,
    // 2018-19
    4.796,4.424,1.366,-0.931,
    // 2019-20
    4.261,5.316,5.911,8.757,
    // 2020-21
    3.740,4.284,4.636,3.295,
    // 2021-22
    4.550,5.899,3.175,5.473,
    // 2022-23
    4.302,3.988,6.433,9.362,
    // 2023-24
    5.699,3.694,1.457,0.857,
    // 2024-25
    1.465,4.107,6.641,5.372,
    // 2025-26
    3.733,3.543,
  ],
  mining: [
    null,null,null,null,
    4.283,-2.368,0.015,0.007,
    -3.739,0.077,-0.678,4.962,
    16.734,4.094,6.587,10.222,
    9.616,9.544,10.504,10.779,
    7.109,6.257,9.063,15.560,
    -9.977,3.361,-3.873,-8.877,
    -1.157,-2.896,-0.240,0.402,
    -1.621,-5.800,-4.085,-1.208,
    -17.707,-8.102,-4.790,-2.903,
    11.486,10.477,4.649,1.042,
    8.300,-3.240,2.622,4.633,
    4.068,4.075,4.663,0.803,
    6.648,-0.443,1.268,2.543,
    -3.127,-0.040,
  ],
  manufacturing: [
    null,null,null,null,
    0.651,12.263,6.624,3.001,
    6.903,3.646,6.017,3.525,
    10.205,9.332,3.353,8.555,
    10.435,11.586,15.526,14.778,
    9.828,7.639,8.258,6.178,
    -0.011,8.733,10.250,11.040,
    10.381,5.372,4.881,1.723,
    0.044,-3.572,-3.478,-4.716,
    -29.718,9.190,12.956,19.614,
    50.116,5.508,0.166,-0.301,
    2.671,-6.880,-4.289,1.480,
    7.262,16.965,14.011,11.272,
    7.592,2.162,3.605,4.846,
    7.724,9.100,
  ],
  electricity: [
    null,null,null,null,
    4.703,1.773,2.962,1.237,
    2.030,5.892,3.403,5.353,
    8.967,9.593,7.219,3.219,
    2.472,5.409,3.719,7.362,
    13.212,7.790,10.236,8.742,
    10.607,11.233,9.402,11.184,
    7.610,9.644,9.217,5.045,
    7.118,1.958,-2.932,2.813,
    -15.314,-3.779,0.861,2.668,
    16.829,11.323,6.392,7.200,
    17.118,7.781,9.878,8.617,
    4.141,11.733,10.128,8.814,
    10.164,2.950,5.082,5.408,
    0.461,4.400,
  ],
  construction: [
    null,null,null,null,
    1.654,-2.393,-0.845,2.863,
    4.662,4.470,2.267,-0.405,
    5.466,5.376,4.076,2.416,
    4.139,0.429,4.788,4.979,
    7.463,8.287,7.382,0.796,
    0.367,1.707,4.975,13.958,
    6.777,5.547,6.966,6.568,
    3.834,1.087,-0.768,2.328,
    -44.913,-6.304,11.534,19.363,
    86.984,16.426,4.236,7.035,
    14.512,6.430,9.076,7.062,
    9.183,14.579,10.048,8.655,
    10.099,8.366,7.905,10.768,
    7.560,7.200,
  ],
  tradeHotelsTransport: [
    null,null,null,null,
    10.464,10.697,9.808,8.295,
    3.927,6.626,9.080,6.347,
    11.192,7.698,5.427,13.192,
    9.934,8.045,9.911,12.691,
    9.427,7.728,7.949,6.031,
    11.358,10.747,10.679,8.837,
    8.069,7.136,7.256,6.404,
    5.859,6.439,6.562,5.100,
    -49.593,-18.604,-9.756,-3.386,
    44.234,15.501,9.162,6.212,
    22.247,13.211,9.680,7.491,
    11.041,5.398,8.046,6.178,
    5.403,6.103,6.717,6.030,
    8.587,7.400,
  ],
  financialRealEstate: [
    null,null,null,null,
    9.393,10.276,11.059,8.344,
    11.841,15.773,8.424,7.797,
    9.130,13.071,12.116,9.795,
    10.168,13.024,10.188,8.755,
    13.475,11.201,5.152,3.225,
    2.806,-0.562,3.333,2.168,
    6.029,6.791,6.671,8.726,
    8.314,8.377,5.057,4.478,
    -1.076,-5.205,9.494,8.062,
    3.663,7.795,5.500,5.806,
    12.272,10.370,9.408,10.913,
    15.027,8.292,8.419,9.003,
    6.644,7.229,7.077,7.828,
    9.476,10.200,
  ],
  publicAdmin: [
    null,null,null,null,
    7.061,5.657,1.995,2.581,
    7.772,3.491,4.227,0.513,
    3.063,7.626,22.334,1.463,
    5.362,6.413,6.729,5.889,
    6.721,6.592,9.114,14.885,
    12.691,7.047,7.488,6.767,
    7.763,7.465,6.199,8.494,
    4.162,7.044,7.017,7.864,
    -13.480,-12.173,-4.939,-0.584,
    3.985,14.545,8.559,3.217,
    21.113,5.041,1.350,2.460,
    9.305,8.904,8.416,8.749,
    9.014,8.862,8.871,8.707,
    9.765,9.700,
  ],
  totalGVA: [
    null,null,null,null,
    5.355,7.041,4.997,4.442,
    6.345,7.129,6.310,4.556,
    7.747,8.453,6.137,6.388,
    7.700,8.358,7.326,8.718,
    9.317,8.290,7.533,6.829,
    4.980,5.540,6.954,7.397,
    7.115,6.139,5.286,4.794,
    4.636,4.228,3.373,3.567,
    -20.810,-5.258,2.972,6.204,
    21.275,9.995,5.009,4.336,
    11.954,5.466,5.325,6.601,
    9.938,9.223,7.999,7.269,
    6.548,5.811,6.493,6.768,
    7.632,8.122,
  ],
};

// ═══════════════════════════════════════════════════════════════════════
// Quarter labels — one per entry, aligned with the arrays above
// ═══════════════════════════════════════════════════════════════════════

const YEARS = [
  "2011-12","2011-12","2011-12","2011-12",
  "2012-13","2012-13","2012-13","2012-13",
  "2013-14","2013-14","2013-14","2013-14",
  "2014-15","2014-15","2014-15","2014-15",
  "2015-16","2015-16","2015-16","2015-16",
  "2016-17","2016-17","2016-17","2016-17",
  "2017-18","2017-18","2017-18","2017-18",
  "2018-19","2018-19","2018-19","2018-19",
  "2019-20","2019-20","2019-20","2019-20",
  "2020-21","2020-21","2020-21","2020-21",
  "2021-22","2021-22","2021-22","2021-22",
  "2022-23","2022-23","2022-23","2022-23",
  "2023-24","2023-24","2023-24","2023-24",
  "2024-25","2024-25","2024-25","2024-25",
  "2025-26","2025-26",
];

const QUARTERS = [
  "Q1","Q2","Q3","Q4",
  "Q1","Q2","Q3","Q4",
  "Q1","Q2","Q3","Q4",
  "Q1","Q2","Q3","Q4",
  "Q1","Q2","Q3","Q4",
  "Q1","Q2","Q3","Q4",
  "Q1","Q2","Q3","Q4",
  "Q1","Q2","Q3","Q4",
  "Q1","Q2","Q3","Q4",
  "Q1","Q2","Q3","Q4",
  "Q1","Q2","Q3","Q4",
  "Q1","Q2","Q3","Q4",
  "Q1","Q2","Q3","Q4",
  "Q1","Q2","Q3","Q4",
  "Q1","Q2",
];

// ═══════════════════════════════════════════════════════════════════════
// Compute broad-sector averages (simple mean of constituent sub-sectors)
// ═══════════════════════════════════════════════════════════════════════

function avgOrNull(...values) {
  const valid = values.filter((v) => v !== null && !isNaN(v));
  if (valid.length === 0) return null;
  return parseFloat((valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(4));
}

const n = YEARS.length;
const broadAgriculture = RAW.agriculture.slice(0, n);
const broadIndustry = Array.from({ length: n }, (_, i) =>
  avgOrNull(RAW.mining[i], RAW.manufacturing[i], RAW.electricity[i], RAW.construction[i])
);
const broadServices = Array.from({ length: n }, (_, i) =>
  avgOrNull(RAW.tradeHotelsTransport[i], RAW.financialRealEstate[i], RAW.publicAdmin[i])
);

// ═══════════════════════════════════════════════════════════════════════
// Build output
// ═══════════════════════════════════════════════════════════════════════

// Build quarter records (filter out base-year nulls)
const quarters = YEARS.map((year, i) => ({
  year,
  quarter: QUARTERS[i],
  label: `${year} ${QUARTERS[i]}`,
  // Broad sectors (aggregated)
  agriculture: RAW.agriculture[i] !== null ? parseFloat(RAW.agriculture[i].toFixed(3)) : null,
  industry: broadIndustry[i],
  services: broadServices[i],
  // All sub-sectors
  mining: RAW.mining[i] !== null ? parseFloat(RAW.mining[i].toFixed(3)) : null,
  manufacturing: RAW.manufacturing[i] !== null ? parseFloat(RAW.manufacturing[i].toFixed(3)) : null,
  electricity: RAW.electricity[i] !== null ? parseFloat(RAW.electricity[i].toFixed(3)) : null,
  construction: RAW.construction[i] !== null ? parseFloat(RAW.construction[i].toFixed(3)) : null,
  tradeHotelsTransport: RAW.tradeHotelsTransport[i] !== null ? parseFloat(RAW.tradeHotelsTransport[i].toFixed(3)) : null,
  financialRealEstate: RAW.financialRealEstate[i] !== null ? parseFloat(RAW.financialRealEstate[i].toFixed(3)) : null,
  publicAdmin: RAW.publicAdmin[i] !== null ? parseFloat(RAW.publicAdmin[i].toFixed(3)) : null,
  totalGVA: RAW.totalGVA[i] !== null ? parseFloat(RAW.totalGVA[i].toFixed(3)) : null,
}));

// Find latest non-null quarter for each broad sector
const latestQuarter = [...quarters].reverse().find((q) => q.agriculture !== null);

const output = {
  lastUpdated: "2026-02-23",
  source: "MoSPI National Accounts Statistics (NAS)",
  sourceUrl: "https://www.mospi.gov.in/",
  baseYear: "2011-12",
  unit: "%",
  notes:
    "Quarterly GVA growth rates at constant 2011-12 prices (real, year-on-year). " +
    "Q1=Apr-Jun, Q2=Jul-Sep, Q3=Oct-Dec, Q4=Jan-Mar. " +
    "Broad sector aggregates (Agriculture/Industry/Services) are simple averages " +
    "of constituent sub-sector growth rates — an approximation. " +
    "Source: MoSPI NAS API, indicator code 21 (GVA Growth Rate), Current series.",
  sectorLabels: {
    agriculture: "Agriculture",
    industry: "Industry (avg)",
    services: "Services (avg)",
    mining: "Mining & Quarrying",
    manufacturing: "Manufacturing",
    electricity: "Electricity, Gas & Utilities",
    construction: "Construction",
    tradeHotelsTransport: "Trade, Hotels & Transport",
    financialRealEstate: "Finance & Real Estate",
    publicAdmin: "Public Administration",
    totalGVA: "Total GVA",
  },
  quarters,
};

if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });
const outPath = join(OUTPUT_DIR, "nas-gva-sectors.json");
writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");

console.log(`✅  Written ${quarters.length} quarters to ${outPath}`);
console.log(`    Coverage: ${quarters[0].label} → ${quarters[quarters.length - 1].label}`);
if (latestQuarter) {
  console.log(`    Latest quarter: ${latestQuarter.label}`);
  console.log(`      Agriculture: ${latestQuarter.agriculture}%`);
  console.log(`      Industry:    ${latestQuarter.industry}%`);
  console.log(`      Services:    ${latestQuarter.services}%`);
  console.log(`      Total GVA:   ${latestQuarter.totalGVA}%`);
}
