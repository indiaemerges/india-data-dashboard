// Indian number and date formatting utilities

/**
 * Format a number in Indian numbering system (lakhs, crores)
 * e.g., 1234567 -> "12,34,567"
 */
export function formatIndianNumber(num: number): string {
  if (num === null || num === undefined || isNaN(num)) return "N/A";

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  if (absNum < 1000) {
    return (isNegative ? "-" : "") + absNum.toLocaleString("en-IN");
  }

  return (isNegative ? "-" : "") + absNum.toLocaleString("en-IN");
}

/**
 * Format large numbers with appropriate suffix
 * e.g., 1500000 -> "15.0L", 120000000 -> "12.0Cr"
 */
export function formatCompactIndian(num: number): string {
  if (num === null || num === undefined || isNaN(num)) return "N/A";

  const absNum = Math.abs(num);
  const sign = num < 0 ? "-" : "";

  if (absNum >= 1e7) {
    return `${sign}${(absNum / 1e7).toFixed(1)}Cr`;
  }
  if (absNum >= 1e5) {
    return `${sign}${(absNum / 1e5).toFixed(1)}L`;
  }
  if (absNum >= 1e3) {
    return `${sign}${(absNum / 1e3).toFixed(1)}K`;
  }
  return `${sign}${absNum.toFixed(1)}`;
}

/**
 * Format percentage with specified decimal places
 */
export function formatPercent(num: number, decimals: number = 1): string {
  if (num === null || num === undefined || isNaN(num)) return "N/A";
  return `${num.toFixed(decimals)}%`;
}

/**
 * Convert calendar year to Indian fiscal year
 * e.g., 2023 -> "2023-24"
 */
export function toFiscalYear(year: number): string {
  const nextYear = (year + 1) % 100;
  return `${year}-${nextYear.toString().padStart(2, "0")}`;
}

/**
 * Format a date string for display
 */
export function formatDate(dateStr: string): string {
  // Handle fiscal year format already present
  if (dateStr.includes("-") && dateStr.length === 7) {
    return dateStr; // Already "2023-24" format
  }

  // Handle ISO date
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
    });
  } catch {
    return dateStr;
  }
}
