/**
 * The numbers behind the dashboard, computed from the entries the feed filter
 * selects (so the period is whatever dates the user set in the filter).
 * Dates are the user's local dates as entered ("YYYY-MM-DD").
 */
export type StatEntry = { occurredOn: string; categoryIds: string[] };

export type SummaryStats = {
  /** Entries in the period. */
  total: number;
  /** Different dates with at least one entry. */
  activeDays: number;
  /** The month with the most entries; of equal months, the latest. */
  bestMonth: { month: string; count: number } | null;
};

export function summaryStats(entries: StatEntry[]): SummaryStats {
  const months = new Map<string, number>();
  for (const { occurredOn } of entries) {
    const month = occurredOn.slice(0, 7);
    months.set(month, (months.get(month) ?? 0) + 1);
  }
  let bestMonth: SummaryStats["bestMonth"] = null;
  for (const [month, count] of months) {
    if (!bestMonth || count > bestMonth.count || (count === bestMonth.count && month > bestMonth.month)) {
      bestMonth = { month, count };
    }
  }
  return {
    total: entries.length,
    activeDays: new Set(entries.map((e) => e.occurredOn)).size,
    bestMonth,
  };
}
