import { readFileSync } from "fs";

const FILE =
  "C:\\Users\\Chintan\\.claude\\projects\\C--Users-Chintan-Documents-project-India\\3ea051c0-c03b-4532-b223-5a0005f6b2e2\\tool-results\\mcp-be345d6d-3109-4f5f-9599-6a42bdc84336-4_get_data-1772720876823.txt";

const j = JSON.parse(readFileSync(FILE, "utf8"));
console.log("totalRecords:", j.meta_data.totalRecords);
console.log("totalPages:", j.meta_data.totalPages);
console.log("recordPerPage:", j.meta_data.recordPerPage);
console.log("records in file:", j.data.length);

const allQ = j.data.filter((r) => r.quarter === "all" && r.state !== "All India");
const years = [...new Set(j.data.map((r) => r.year))].sort();
const allQYears = [...new Set(allQ.map((r) => r.year))].sort();
const genders = [...new Set(allQ.map((r) => r.gender))].sort();
console.log("Years in full data:", years);
console.log("Years in quarter=all data:", allQYears);
console.log("Genders in quarter=all:", genders);
console.log("quarter=all, non-AI rows:", allQ.length);
console.log("Sample record:", JSON.stringify(j.data[0]));
