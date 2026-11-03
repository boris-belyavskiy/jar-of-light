import { describe, expect, it } from "vitest";
import { summaryStats, type StatEntry } from "@/lib/dashboard-stats";

const on = (...dates: string[]): StatEntry[] => dates.map((occurredOn) => ({ occurredOn, categoryIds: [] }));

const OCTOBER = on("2026-10-05", "2026-10-05", "2026-10-20");
const NOVEMBER = on("2026-11-02", "2026-11-09");

describe("dashboard summary stats", () => {
  it("given 5 entries in October and November, when computed for the whole period, then the stats add up", () => {
    expect(summaryStats([...OCTOBER, ...NOVEMBER])).toEqual({
      total: 5,
      activeDays: 4,
      bestMonth: { month: "2026-10", count: 3 },
    });
  });

  it("given the same entries, when the user selects November, then only November counts", () => {
    expect(summaryStats(NOVEMBER)).toEqual({
      total: 2,
      activeDays: 2,
      bestMonth: { month: "2026-11", count: 2 },
    });
  });

  it("given no entries, when computed, then everything is empty", () => {
    expect(summaryStats([])).toEqual({ total: 0, activeDays: 0, bestMonth: null });
  });
});
