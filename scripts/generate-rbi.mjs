/**
 * generate-rbi.mjs
 * Run: node scripts/generate-rbi.mjs
 *
 * Generates:
 *   public/data/rbi/policy-rates.json   — event-level rate decisions
 *   public/data/rbi/forex-reserves.json — monthly forex reserves (USD bn)
 *
 * Pre-MPC era (before Oct 4, 2016): approximate annual/key-event values.
 * MPC era (Oct 4, 2016 onwards): exact MPC decision dates.
 * Only change-events are recorded; Plotly's hv step mode fills the gaps.
 */

import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "data", "rbi");
mkdirSync(OUT, { recursive: true });

// ─────────────────────────────────────────────────────────────────────────────
// POLICY RATES — event-level (change events only)
// ─────────────────────────────────────────────────────────────────────────────

/** Repo Rate (LAF) — key change events */
const repoRateEvents = [
  // ── Pre-MPC era ───────────────────────────────────────────────────────────
  // Annual end-of-year approximations shown as Jan 1 of each year,
  // with notable intra-year inflection points added for 2008–2009.
  { date: "2004-01-01", value: 6.00 },
  { date: "2005-01-01", value: 6.25 },
  { date: "2006-01-01", value: 7.25 },
  { date: "2007-01-01", value: 7.75 },
  // 2008 crisis: repo peaked at 9% in late Jul, then cut aggressively
  { date: "2008-07-29", value: 9.00 },  // peak (emergency hike)
  { date: "2008-10-20", value: 8.00 },  // first post-peak cut
  { date: "2008-11-03", value: 7.50 },
  { date: "2008-12-08", value: 6.50 },
  // 2009 cuts
  { date: "2009-01-02", value: 5.50 },
  { date: "2009-03-04", value: 5.00 },
  { date: "2009-04-21", value: 4.75 },
  // 2010–2011 hiking cycle (approximate dates)
  { date: "2010-01-29", value: 5.00 },
  { date: "2010-03-19", value: 5.25 },
  { date: "2010-04-20", value: 5.25 }, // (unchanged, included for continuity)
  { date: "2010-07-02", value: 5.75 },
  { date: "2010-09-16", value: 6.00 },
  { date: "2010-11-02", value: 6.25 },
  { date: "2011-01-25", value: 6.50 },
  { date: "2011-03-17", value: 6.75 },
  { date: "2011-05-03", value: 7.25 },
  { date: "2011-06-16", value: 7.50 },
  { date: "2011-07-26", value: 8.00 },
  { date: "2011-10-25", value: 8.50 },  // cycle peak
  // 2012–2016 easing cycle (approximate dates)
  { date: "2012-04-17", value: 8.00 },
  { date: "2013-01-29", value: 7.75 },
  { date: "2013-05-03", value: 7.25 },
  { date: "2013-09-20", value: 7.50 },  // Rajan hike on taking office
  { date: "2014-01-28", value: 8.00 },  // brief hike
  { date: "2015-01-15", value: 7.75 },  // off-cycle cut
  { date: "2015-03-04", value: 7.50 },
  { date: "2015-06-02", value: 7.25 },
  { date: "2015-09-29", value: 6.75 },
  { date: "2016-04-05", value: 6.50 },  // last pre-MPC cut

  // ── MPC era: exact decision dates ─────────────────────────────────────────
  { date: "2016-10-04", value: 6.25 },  // first MPC meeting
  { date: "2017-08-02", value: 6.00 },
  { date: "2018-06-06", value: 6.25 },
  { date: "2018-08-01", value: 6.50 },
  { date: "2019-02-07", value: 6.25 },
  { date: "2019-04-04", value: 6.00 },
  { date: "2019-06-06", value: 5.75 },
  { date: "2019-08-07", value: 5.40 },
  { date: "2019-10-04", value: 5.15 },
  { date: "2020-03-27", value: 4.40 },  // emergency COVID cut
  { date: "2020-05-22", value: 4.00 },  // emergency COVID cut
  { date: "2022-05-04", value: 4.40 },  // emergency tightening
  { date: "2022-06-08", value: 4.90 },
  { date: "2022-08-05", value: 5.40 },
  { date: "2022-09-30", value: 5.90 },
  { date: "2022-12-07", value: 6.25 },
  { date: "2023-02-08", value: 6.50 },
  // Held at 6.50% from Apr 2023 through Dec 2024
  { date: "2025-02-07", value: 6.25 },
  { date: "2025-04-09", value: 6.00 },
  { date: "2025-06-06", value: 5.50 },  // surprise 50 bps cut
  { date: "2025-12-05", value: 5.25 },  // 25 bps cut; Feb 6 2026 unchanged
  // Sentinel: extend step chart to current date (no further change)
  { date: "2026-03-01", value: 5.25 },
];

/** Reverse Repo / SDF — lower bound of LAF corridor */
const reverseRepoSDFEvents = [
  // ── Pre-MPC era ───────────────────────────────────────────────────────────
  // Corridor was ~100 bps below repo (widened to 150 bps in crisis periods)
  { date: "2004-01-01", value: 4.50 },
  { date: "2005-01-01", value: 5.25 },
  { date: "2006-01-01", value: 6.25 },
  { date: "2007-01-01", value: 6.75 },
  { date: "2008-07-29", value: 8.00 },
  { date: "2008-10-20", value: 7.00 },
  { date: "2008-11-03", value: 6.50 },
  { date: "2008-12-08", value: 5.50 },
  { date: "2009-01-02", value: 4.50 },
  { date: "2009-03-04", value: 4.00 },
  { date: "2009-04-21", value: 3.25 },
  { date: "2010-01-29", value: 3.50 },
  { date: "2010-03-19", value: 3.75 },
  { date: "2010-07-02", value: 4.50 },
  { date: "2010-09-16", value: 5.00 },
  { date: "2010-11-02", value: 5.25 },
  { date: "2011-01-25", value: 5.50 },
  { date: "2011-03-17", value: 5.75 },
  { date: "2011-05-03", value: 6.25 },
  { date: "2011-06-16", value: 6.50 },
  { date: "2011-07-26", value: 7.00 },
  { date: "2011-10-25", value: 7.50 },
  { date: "2012-04-17", value: 7.00 },
  { date: "2013-01-29", value: 6.75 },
  { date: "2013-05-03", value: 6.25 },
  { date: "2013-09-20", value: 6.50 },
  { date: "2014-01-28", value: 7.00 },
  { date: "2015-01-15", value: 6.75 },
  { date: "2015-03-04", value: 6.50 },
  { date: "2015-06-02", value: 6.25 },
  { date: "2015-09-29", value: 5.75 }, // corridor narrowed; Rajan era
  { date: "2016-04-05", value: 5.50 },

  // ── MPC era ───────────────────────────────────────────────────────────────
  // Corridor narrowed to 25 bps above/below repo from late 2017
  // Note: SDF replaced Reverse Repo as LAF floor from April 8, 2022
  { date: "2016-10-04", value: 5.75 }, // RR = repo (6.25) - 50 bps
  { date: "2017-08-02", value: 5.75 }, // repo cut to 6.00; RR stays → 25 bps corridor
  { date: "2018-06-06", value: 6.00 }, // repo 6.25, RR 6.00 (25 bps)
  { date: "2018-08-01", value: 6.25 }, // repo 6.50, RR 6.25
  { date: "2019-02-07", value: 6.00 }, // repo 6.25, RR 6.00
  { date: "2019-04-04", value: 5.75 },
  { date: "2019-06-06", value: 5.50 },
  { date: "2019-08-07", value: 5.15 },
  { date: "2019-10-04", value: 4.90 },
  { date: "2020-03-27", value: 4.00 }, // repo 4.40, RR 4.00
  { date: "2020-05-22", value: 3.35 }, // corridor widened during COVID accommodation
  // SDF introduced April 8, 2022 (replaces Reverse Repo as floor of LAF)
  { date: "2022-04-08", value: 3.75 }, // SDF introduced at 3.75%
  { date: "2022-05-04", value: 4.15 }, // repo 4.40, SDF 4.15 (25 bps)
  { date: "2022-06-08", value: 4.65 },
  { date: "2022-08-05", value: 5.15 },
  { date: "2022-09-30", value: 5.65 },
  { date: "2022-12-07", value: 6.00 },
  { date: "2023-02-08", value: 6.25 }, // repo 6.50, SDF 6.25
  // SDF held at 6.25% while repo held at 6.50% (Apr 2023 – Dec 2024)
  { date: "2025-02-07", value: 6.00 }, // repo 6.25, SDF 6.00
  { date: "2025-04-09", value: 5.75 }, // repo 6.00, SDF 5.75
  { date: "2025-06-06", value: 5.25 }, // repo 5.50, SDF 5.25
  { date: "2025-12-05", value: 5.00 }, // repo 5.25, SDF 5.00
  // Sentinel: extend step chart to current date
  { date: "2026-03-01", value: 5.00 },
];

/** Cash Reserve Ratio (CRR) — change events */
const crrEvents = [
  // Pre-MPC annual values (Jan 1)
  { date: "2000-01-01", value: 8.00 },
  { date: "2001-01-01", value: 5.50 },
  { date: "2002-01-01", value: 4.75 },
  { date: "2003-01-01", value: 4.50 },
  { date: "2005-01-01", value: 5.00 }, // raised
  // 2007–2008 hiking cycle
  { date: "2007-01-01", value: 6.50 }, // raised through 2007
  { date: "2007-08-04", value: 7.00 },
  { date: "2007-11-10", value: 7.50 },
  // 2008 peak and cuts
  { date: "2008-08-30", value: 9.00 }, // peak (multiple hikes through 2008)
  { date: "2008-10-11", value: 7.50 }, // emergency cuts
  { date: "2008-11-08", value: 5.50 },
  { date: "2009-01-17", value: 5.00 },
  // Extended hold at 5% then move to 6%
  { date: "2010-02-01", value: 5.50 },
  { date: "2010-04-24", value: 6.00 },
  // Hold at 6% through 2011, then cuts from 2012
  { date: "2012-01-28", value: 5.50 },
  { date: "2012-03-10", value: 4.75 },
  { date: "2012-09-22", value: 4.50 },
  { date: "2013-02-09", value: 4.00 },
  // Hold at 4% from Feb 2013 through 2019
  // COVID cuts
  { date: "2020-03-28", value: 3.00 }, // emergency cut (100 bps)
  // Restoration
  { date: "2021-03-27", value: 3.50 },
  { date: "2021-05-22", value: 4.00 },
  // Tightening cycle
  { date: "2022-05-07", value: 4.50 },
  // Easing
  { date: "2024-12-06", value: 4.00 },
  // Jun 6, 2025: 100 bps cut announced, phased in 4 x 25 bps tranches
  { date: "2025-09-06", value: 3.75 },  // tranche 1 effective
  { date: "2025-10-04", value: 3.50 },  // tranche 2 effective
  { date: "2025-11-01", value: 3.25 },  // tranche 3 effective
  { date: "2025-11-29", value: 3.00 },  // tranche 4 effective (final)
  // Sentinel: extend step chart to current date
  { date: "2026-03-01", value: 3.00 },
];

/** Statutory Liquidity Ratio (SLR) — change events */
const slrEvents = [
  // Gradual reduction from 25% over the years
  { date: "2000-01-01", value: 25.00 },
  // Held at 25% until 2007
  { date: "2007-11-10", value: 24.00 }, // cut 1% during crisis preparations
  // Hold at 24% 2007–2011
  { date: "2012-01-01", value: 23.00 },
  // Hold at 23% 2012–2013
  { date: "2014-06-14", value: 22.50 },
  { date: "2014-08-09", value: 22.00 },
  { date: "2015-02-07", value: 21.50 },
  { date: "2016-04-05", value: 21.25 },
  { date: "2016-10-04", value: 20.75 }, // first MPC
  { date: "2017-06-07", value: 20.50 },
  { date: "2017-10-04", value: 19.50 },
  { date: "2018-01-03", value: 19.50 },
  { date: "2018-06-06", value: 19.50 },
  // MoF-directed reductions 2018–2020
  { date: "2018-10-05", value: 19.00 },
  { date: "2019-04-01", value: 18.75 },
  { date: "2020-04-01", value: 18.00 }, // SLR reduced; held at 18% since
  // Sentinel: extend step chart to current date (confirmed unchanged through Feb 2026)
  { date: "2026-03-01", value: 18.00 },
];

// ─────────────────────────────────────────────────────────────────────────────
// FOREX RESERVES — monthly (USD billion)
// ─────────────────────────────────────────────────────────────────────────────
// Key anchor points (year-end or notable intra-year peaks/troughs).
// Monthly values between anchors are linearly interpolated.

const forexAnchors = [
  { date: "2000-01", value: 35.1 },
  { date: "2000-12", value: 39.6 },
  { date: "2001-12", value: 45.9 },
  { date: "2002-12", value: 67.7 },
  { date: "2003-12", value: 98.0 },
  { date: "2004-12", value: 126.6 },
  { date: "2005-12", value: 132.5 },
  { date: "2006-12", value: 170.2 },
  { date: "2007-12", value: 267.7 },
  { date: "2008-03", value: 309.7 }, // pre-crisis peak
  { date: "2008-12", value: 252.0 },
  { date: "2009-12", value: 279.1 },
  { date: "2010-12", value: 297.4 },
  { date: "2011-12", value: 294.4 },
  { date: "2012-12", value: 295.5 },
  { date: "2013-08", value: 275.5 }, // taper-tantrum trough
  { date: "2013-12", value: 296.0 },
  { date: "2014-12", value: 322.5 },
  { date: "2015-12", value: 351.4 },
  { date: "2016-12", value: 360.2 },
  { date: "2017-12", value: 409.4 },
  { date: "2018-12", value: 393.7 },
  { date: "2019-12", value: 457.0 },
  { date: "2020-12", value: 577.0 },
  { date: "2021-09", value: 641.0 }, // cycle peak
  { date: "2021-12", value: 633.6 },
  { date: "2022-10", value: 524.5 }, // INR-defence trough
  { date: "2022-12", value: 562.7 },
  { date: "2023-12", value: 623.0 },
  { date: "2024-09", value: 689.2 }, // record at the time
  { date: "2024-12", value: 625.0 }, // fell on RBI FX intervention
  // 2025 — directly sourced from RBI weekly supplement (end-month readings)
  { date: "2025-02", value: 638.3 },
  { date: "2025-03", value: 668.3 }, // sharp recovery; RBI $10 bn FX swap
  { date: "2025-04", value: 677.0 },
  { date: "2025-05", value: 691.5 },
  { date: "2025-06", value: 698.9 }, // all-time high at the time
  { date: "2025-07", value: 698.2 },
  { date: "2025-08", value: 690.0 },
  { date: "2025-09", value: 693.0 },
  { date: "2025-10", value: 689.7 },
  { date: "2025-11", value: 690.0 },
  { date: "2025-12", value: 688.0 },
  { date: "2026-01", value: 723.8 }, // new all-time high (Jan 30, 2026)
];

// ── Interpolation helper ──────────────────────────────────────────────────────

/** Convert "YYYY-MM" to a fractional year number for interpolation */
function toFrac(dateStr) {
  const [y, m] = dateStr.split("-").map(Number);
  return y + (m - 1) / 12;
}

/** Build sorted monthly series from anchor points via linear interpolation */
function interpolateMonthly(anchors) {
  const sorted = [...anchors].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0
  );
  const result = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    const [ay, am] = a.date.split("-").map(Number);
    const [by, bm] = b.date.split("-").map(Number);
    const steps = (by - ay) * 12 + (bm - am);
    for (let s = 0; s < steps; s++) {
      const totalMonths = am - 1 + s;
      const y = ay + Math.floor(totalMonths / 12);
      const m = (totalMonths % 12) + 1;
      const date = `${y}-${String(m).padStart(2, "0")}`;
      const t = s / steps;
      const value = Math.round((a.value + t * (b.value - a.value)) * 10) / 10;
      result.push({ date, value });
    }
  }
  // Push final anchor
  result.push({ date: sorted.at(-1).date, value: sorted.at(-1).value });
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Write files
// ─────────────────────────────────────────────────────────────────────────────

const policyRates = {
  lastUpdated: "2026-03",
  notes:
    "Event-level policy rate changes. " +
    "Pre-Oct 2016: approximate dates (annual and key intra-year inflection points). " +
    "MPC era (Oct 4, 2016 onwards): exact MPC decision dates. " +
    "SDF replaced Reverse Repo as LAF floor from April 8, 2022. " +
    "Source: RBI DBIE / MPC policy statements.",
  repoRate: repoRateEvents,
  reverseRepoSDF: reverseRepoSDFEvents,
  crr: crrEvents,
  slr: slrEvents,
};

const forexReserves = {
  lastUpdated: "2026-01",
  unit: "USD billion",
  notes:
    "Total foreign exchange reserves including gold, SDRs, and reserve tranche position. " +
    "Values are monthly; pre-2016 months are linearly interpolated between known anchor points. " +
    "Source: RBI Weekly Statistical Supplement / World Bank.",
  monthly: interpolateMonthly(forexAnchors),
};

writeFileSync(
  join(OUT, "policy-rates.json"),
  JSON.stringify(policyRates, null, 2)
);
console.log("✓ Wrote public/data/rbi/policy-rates.json");

writeFileSync(
  join(OUT, "forex-reserves.json"),
  JSON.stringify(forexReserves, null, 2)
);
console.log(
  `✓ Wrote public/data/rbi/forex-reserves.json  (${forexReserves.monthly.length} monthly data points)`
);
