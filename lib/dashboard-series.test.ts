import { describe, expect, it } from "vitest";
import { entriesByCategory, entriesByDate, type StatEntry } from "@/lib/dashboard-stats";

const on = (...dates: string[]): StatEntry[] => dates.map((occurredOn) => ({ occurredOn, categoryIds: [] }));

describe("entriesByDate", () => {
  it("counts per date and keeps the empty dates between entries", () => {
    expect(entriesByDate(on("2026-10-03", "2026-10-01", "2026-10-03"), {})).toEqual({
      unit: "day",
      points: [
        { key: "2026-10-01", count: 1 },
        { key: "2026-10-02", count: 0 },
        { key: "2026-10-03", count: 2 },
      ],
    });
  });

  it("covers the whole period the user selected, even where there are no entries", () => {
    const { points } = entriesByDate(on("2026-10-02"), { from: "2026-10-01", to: "2026-10-04" });
    expect(points.map((p) => p.key)).toEqual(["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"]);
    expect(points.map((p) => p.count)).toEqual([0, 1, 0, 0]);
  });

  it("crosses a month and a year boundary", () => {
    const { points } = entriesByDate(on("2026-12-31", "2027-01-01"), {});
    expect(points.map((p) => p.key)).toEqual(["2026-12-31", "2027-01-01"]);
  });

  it("switches to months for a long period, keeping empty months", () => {
    expect(entriesByDate(on("2026-01-15", "2026-01-20", "2026-04-01"), {})).toEqual({
      unit: "month",
      points: [
        { key: "2026-01", count: 2 },
        { key: "2026-02", count: 0 },
        { key: "2026-03", count: 0 },
        { key: "2026-04", count: 1 },
      ],
    });
  });

  it("does not add years of empty bars for a far-off filter date", () => {
    const { points } = entriesByDate(on("2026-10-02"), { from: "1990-01-01" });
    expect(points).toEqual([{ key: "2026-10", count: 1 }]);
  });

  it("has nothing to show without entries", () => {
    expect(entriesByDate([], { from: "2026-10-01" }).points).toEqual([]);
  });
});

describe("entriesByCategory", () => {
  const entry = (...categoryIds: string[]): StatEntry => ({ occurredOn: "2026-10-01", categoryIds });

  it("counts an entry in each of its categories, most frequent first", () => {
    expect(entriesByCategory([entry("family", "work"), entry("family"), entry("friends", "family")])).toEqual([
      { categoryId: "family", count: 3 },
      { categoryId: "work", count: 1 },
      { categoryId: "friends", count: 1 },
    ]);
  });

  it("puts entries without a category last, however many there are", () => {
    expect(entriesByCategory([entry(), entry(), entry(), entry("work")])).toEqual([
      { categoryId: "work", count: 1 },
      { categoryId: null, count: 3 },
    ]);
  });

  it("has nothing to show without entries", () => {
    expect(entriesByCategory([])).toEqual([]);
  });
});
