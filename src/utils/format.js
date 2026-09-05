/**
 * format.js
 *
 * Small helpers for showing money the way Indians actually read it.
 * Indian digit grouping is 2-2-3 (12,34,567), not the Western 3-3-3
 * (1,234,567), so we use the "en-IN" locale rather than formatting by hand.
 */

/** 1234567 -> "₹12,34,567" */
export function formatRupees(amount) {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? "-" : "";
  return sign + "₹" + Math.abs(rounded).toLocaleString("en-IN");
}

/**
 * Shortens big amounts the way people speak them.
 * 8500000 -> "₹85 L", 12500000 -> "₹1.25 Cr"
 */
export function formatShortRupees(amount) {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(1)} L`;
  if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(0)}k`;
  return formatRupees(amount);
}

/** Shows a score change as "+12" or "-4", used on the feedback card. */
export function formatDelta(value) {
  return value > 0 ? `+${value}` : `${value}`;
}

/**
 * Turns a percentage into a letter grade.
 * Used on the level-complete screen and the final report.
 */
export function scoreToGrade(percent) {
  if (percent >= 85) return { grade: "A+", label: "Financially Sharp", color: "#22c55e" };
  if (percent >= 70) return { grade: "A", label: "Strong Decisions", color: "#4ade80" };
  if (percent >= 55) return { grade: "B", label: "On the Right Track", color: "#fbbf24" };
  if (percent >= 40) return { grade: "C", label: "Needs Work", color: "#fb923c" };
  return { grade: "D", label: "Rethink the Basics", color: "#ef4444" };
}

/**
 * Simple compound-interest projection, used by the final report to estimate
 * "your portfolio at 30". Monthly compounding of a recurring investment.
 */
export function projectCorpus(monthlyInvestment, years, annualRatePercent) {
  const r = annualRatePercent / 100 / 12;
  const n = years * 12;
  if (r === 0) return monthlyInvestment * n;
  return monthlyInvestment * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
}
