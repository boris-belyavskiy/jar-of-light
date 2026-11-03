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

/** Up to about two months, the chart shows every day; a longer period would be too thin, so it shows months. */
const MAX_DAYS_ON_CHART = 62;
const DAY_MS = 24 * 60 * 60 * 1000;

export type DateSeries = { unit: "day" | "month"; points: { key: string; count: number }[] };

function dayNumber(date: string) {
  return Date.parse(`${date}T00:00:00Z`) / DAY_MS;
}

function monthsBetween(first: string, last: string) {
  const months: string[] = [];
  let [year, month] = first.split("-").map(Number);
  const [endYear, endMonth] = last.split("-").map(Number);
  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push(`${year}-${String(month).padStart(2, "0")}`);
    month += 1;
    if (month > 12) [year, month] = [year + 1, 1];
  }
  return months;
}

/**
 * Entries per date across the period, with empty dates included so that gaps
 * show. Without dates in the filter, the period runs from the first entry to
 * the last. A long period is shown by month, from the first entry's month to
 * the last one's, so a far-off filter date can't add years of empty bars.
 */
export function entriesByDate(entries: StatEntry[], period: { from?: string; to?: string }): DateSeries {
  if (entries.length === 0) return { unit: "day", points: [] };
  const dates = entries.map((e) => e.occurredOn).sort();
  const first = dates[0];
  const last = dates[dates.length - 1];
  const start = period.from ?? first;
  const end = period.to ?? last;
  const counts = new Map<string, number>();

  if (dayNumber(end) - dayNumber(start) < MAX_DAYS_ON_CHART) {
    for (const date of dates) counts.set(date, (counts.get(date) ?? 0) + 1);
    const points = [];
    for (let day = dayNumber(start); day <= dayNumber(end); day += 1) {
      const key = new Date(day * DAY_MS).toISOString().slice(0, 10);
      points.push({ key, count: counts.get(key) ?? 0 });
    }
    return { unit: "day", points };
  }

  for (const date of dates) {
    const month = date.slice(0, 7);
    counts.set(month, (counts.get(month) ?? 0) + 1);
  }
  return {
    unit: "month",
    points: monthsBetween(first, last).map((key) => ({ key, count: counts.get(key) ?? 0 })),
  };
}

export type CategoryCount = { categoryId: string | null; count: number };

/**
 * Entries per category, most frequent first; `null` is entries without a
 * category, always last. An entry with several categories counts in each of
 * them, so the counts can add up to more than the number of entries.
 */
export function entriesByCategory(entries: StatEntry[]): CategoryCount[] {
  const counts = new Map<string | null, number>();
  for (const { categoryIds } of entries) {
    for (const id of categoryIds.length > 0 ? categoryIds : [null]) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  const none = counts.get(null);
  counts.delete(null);
  const sorted: CategoryCount[] = [...counts]
    .map(([categoryId, count]) => ({ categoryId, count }))
    .sort((a, b) => b.count - a.count);
  return none ? [...sorted, { categoryId: null, count: none }] : sorted;
}
