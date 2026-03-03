/**
 * Seasonal leaderboard helper
 */

export function getSeasonId() {
  const now = new Date();
  return `${now.getUTCFullYear()}-S${Math.floor(now.getUTCMonth() / 3) + 1}`;
}
