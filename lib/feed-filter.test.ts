import { describe, expect, it } from "vitest";
import {
  feedHref,
  isFiltered,
  likePattern,
  parseFeedFilter,
  parseFeedView,
  safeFeedPath,
  SEARCH_MAX_LENGTH,
  toggleCategory,
} from "@/lib/feed-filter";

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

describe("sort", () => {
  it("reads oldest first and ignores anything else", () => {
    expect(parseFeedFilter({ sort: "oldest" }).sort).toBe("oldest");
    expect(parseFeedFilter({ sort: "random" }).sort).toBeUndefined();
    expect(parseFeedFilter({}).sort).toBeUndefined();
  });

  it("keeps the URL clean for the default and survives a category toggle", () => {
    expect(feedHref({ categoryIds: [], sort: "newest" })).toBe("/app");
    expect(feedHref({ categoryIds: [], sort: "oldest" })).toBe("/app?sort=oldest");
    expect(feedHref(toggleCategory({ categoryIds: [], sort: "oldest" }, A))).toBe(`/app?category=${A}&sort=oldest`);
  });
});

describe("the dashboard view", () => {
  it("reads and writes the view next to the filter", () => {
    expect(parseFeedView({ stats: "1" })).toEqual({ mode: "stats" });
    expect(feedHref({ categoryIds: [A], from: "2026-10-01" }, { mode: "stats" })).toBe(
      `/app?category=${A}&from=2026-10-01&stats=1`,
    );
  });
});

describe("search", () => {
  it("trims the words, drops an empty search and limits the length", () => {
    expect(parseFeedFilter({ q: "  кофе с Аней " }).q).toBe("кофе с Аней");
    expect(parseFeedFilter({ q: "   " }).q).toBeUndefined();
    expect(parseFeedFilter({ q: "a".repeat(500) }).q).toHaveLength(SEARCH_MAX_LENGTH);
  });

  it("counts as a filter", () => {
    expect(isFiltered({ categoryIds: [], q: "кофе" })).toBe(true);
  });

  it("matches wildcards literally", () => {
    expect(likePattern("кофе")).toBe("%кофе%");
    expect(likePattern("100%_a\\b")).toBe("%100\\%\\_a\\\\b%");
  });

  it("survives saving an entry: a space in the URL is a valid place to come back to", () => {
    const href = feedHref({ categoryIds: [], q: "кофе с Аней" });
    expect(safeFeedPath(href)).toBe(href);
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

describe("feed view", () => {
  it("reads the list, the composer, one entry and editing from the URL", () => {
    expect(parseFeedView({})).toEqual({ mode: "list" });
    expect(parseFeedView({ new: "1" })).toEqual({ mode: "new" });
    expect(parseFeedView({ entry: A })).toEqual({ mode: "view", id: A });
    expect(parseFeedView({ entry: A, edit: "1" })).toEqual({ mode: "edit", id: A });
    expect(parseFeedView({ entry: "not-an-id" })).toEqual({ mode: "list" });
  });

  it("keeps the filter when opening an entry", () => {
    expect(feedHref({ categoryIds: [A], from: "2026-10-01" }, { mode: "edit", id: B })).toBe(
      `/app?category=${A}&from=2026-10-01&entry=${B}&edit=1`,
    );
    expect(feedHref({ categoryIds: [] }, { mode: "new" })).toBe("/app?new=1");
  });
});

describe("safeFeedPath", () => {
  it("allows only paths inside the feed", () => {
    expect(safeFeedPath(`/app?entry=${A}`)).toBe(`/app?entry=${A}`);
    expect(safeFeedPath("/app")).toBe("/app");
    expect(safeFeedPath("https://evil.example")).toBe("/app");
    expect(safeFeedPath("//evil.example")).toBe("/app");
    expect(safeFeedPath("/app/../x")).toBe("/app");
    expect(safeFeedPath(null)).toBe("/app");
  });
});
