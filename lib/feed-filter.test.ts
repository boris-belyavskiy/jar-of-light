import { describe, expect, it } from "vitest";
import { feedHref, isFiltered, parseFeedFilter, toggleCategory } from "@/lib/feed-filter";

const A = "00000000-0000-4000-8000-00000000000a";
const B = "00000000-0000-4000-8000-00000000000b";

describe("parseFeedFilter", () => {
  it("reads several categories and a date range", () => {
    expect(parseFeedFilter({ category: [A, B], from: "2026-10-01", to: "2026-10-27" })).toEqual({
      categoryIds: [A, B],
      from: "2026-10-01",
      to: "2026-10-27",
    });
  });

  it("drops invalid and duplicate values", () => {
    expect(parseFeedFilter({ category: [A, A, "family"], from: "yesterday", to: "2026-13-45" })).toEqual({
      categoryIds: [A],
      from: undefined,
      to: undefined,
    });
  });

  it("swaps a reversed range", () => {
    const f = parseFeedFilter({ from: "2026-10-27", to: "2026-10-01" });
    expect([f.from, f.to]).toEqual(["2026-10-01", "2026-10-27"]);
  });

  it("allows an open range on either side", () => {
    expect(parseFeedFilter({ from: "2026-10-01" })).toEqual({ categoryIds: [], from: "2026-10-01", to: undefined });
  });
});

describe("toggleCategory and feedHref", () => {
  it("adds and removes a category, keeping the dates", () => {
    const start = { categoryIds: [A], from: "2026-10-01" };
    expect(feedHref(toggleCategory(start, B))).toBe(`/app?category=${A}&category=${B}&from=2026-10-01`);
    expect(feedHref(toggleCategory(start, A))).toBe("/app?from=2026-10-01");
  });

  it("'All' clears categories but not dates", () => {
    expect(feedHref({ categoryIds: [], from: "2026-10-01", to: "2026-10-27" })).toBe("/app?from=2026-10-01&to=2026-10-27");
    expect(feedHref({ categoryIds: [] })).toBe("/app");
  });

  it("knows when anything is filtered", () => {
    expect(isFiltered({ categoryIds: [] })).toBe(false);
    expect(isFiltered({ categoryIds: [], to: "2026-10-27" })).toBe(true);
  });
});
