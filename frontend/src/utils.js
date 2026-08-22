/**
 * Shared UI utility functions for candidate display.
 *
 * Used by CandidateLeaderboard and CandidateDetailModal to avoid duplication.
 */

/**
 * Return a color hex based on a 0-100 score value.
 */
export function getScoreColor(score) {
  if (score >= 80) return '#34d399';
  if (score >= 60) return '#38bdf8';
  if (score >= 40) return '#fbbf24';
  return '#f87171';
}

/**
 * Format a duration in months as "X.Y yrs".
 */
export function formatYears(months) {
  if (!months) return '0.0 yrs';
  return (months / 12).toFixed(1) + ' yrs';
}
