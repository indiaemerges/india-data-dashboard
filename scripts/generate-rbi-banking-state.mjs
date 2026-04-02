// scripts/generate-rbi-banking-state.mjs
// Reads RBI Handbook Tables 152, 154, 155, 156 and generates
// public/data/rbi/banking-state.json with 4 state-level indicators:
//   1. cd_ratio       — Credit-Deposit Ratio (%, Place of Utilisation)
//   2. branches       — Bank branches (count)
//   3. branch_density — Branches per lakh population
//   4. credit_pc      — Bank credit per capita (₹ thousand)
//   5. deposits_pc    — Bank deposits per capita (₹ thousand)
//
// Source: RBI Handbook of Statistics on Indian States 2024-25
//   Table 152: State-wise Offices of SCBs
//   Table 154: State-wise CD Ratio (Place of Utilisation)
//   Table 155: State-wise Deposits by SCBs
//   Table 156: State-wise Credit by SCBs

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { parse as xlsxParse } from "xlsx"; // we'll use a simple approach

// ── Since we can't use xlsx in mjs easily, we'll import the data ──────────────
// Data was pre-read from the Excel files and embedded here directly.
// Years in sheet (ii): 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025
// We want indices for 2016-2024 (FY 2015-16 to FY 2023-24): positions 1-9 (0-based from 2015)
// FY label: col year N = "end-March N" = FY (N-1)-N  e.g. 2016 = FY 2015-16

console.log("This script requires Python to run. Use generate-rbi-banking-state.py instead.");
