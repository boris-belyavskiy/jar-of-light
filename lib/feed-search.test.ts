import { describe, expect, it } from "vitest";
import { filterKey, filterToParams, matchesQuery } from "@/lib/feed-search";
import { parseFeedFilter } from "@/lib/feed-filter";

describe("matchesQuery", () => {
  it("finds a phrase anywhere in the text, ignoring case", () => {
    expect(matchesQuery("A warm evening with my sister", "warm EVENING")).toBe(true);
    expect(matchesQuery("A warm evening with my sister", "sister.")).toBe(false);
  });

  it("works in Cyrillic and with the same letter typed two ways", () => {
    expect(matchesQuery("Тёплый вечер с сестрой", "вечер с СЕСТРОЙ")).toBe(true);
    expect(matchesQuery("café au lait", "café")).toBe(true);
  });

  it("matches everything when the words are empty, and nothing in text that could not be read", () => {
    expect(matchesQuery("anything", "   ")).toBe(true);
    expect(matchesQuery(null, "anything")).toBe(false);
    expect(matchesQuery(null, "")).toBe(true);
  });

  it("treats % and _ as ordinary characters, unlike a LIKE pattern", () => {
    expect(matchesQuery("100% sure", "100%")).toBe(true);
    expect(matchesQuery("a_b", "a_b")).toBe(true);
    expect(matchesQuery("axb", "a_b")).toBe(false);
  });
});

describe("filterToParams", () => {
  it("round-trips the filter without the search words", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    const filter = { categoryIds: [id], from: "2026-01-01", to: "2026-02-01", sort: "oldest" as const, starred: true, q: "secret" };
    const back = parseFeedFilter(filterToParams(filter));
    expect(back).toEqual({ categoryIds: [id], from: "2026-01-01", to: "2026-02-01", sort: "oldest", starred: true });
    expect(JSON.stringify(filterToParams(filter))).not.toContain("secret");
  });
});

describe("filterKey", () => {
  it("is the same for the same rows and changes when the rows to fetch change", () => {
    const base = { categoryIds: [], from: "2026-01-01" };
    expect(filterKey(base)).toBe(filterKey({ ...base, q: "ignored" }));
    expect(filterKey(base)).not.toBe(filterKey({ ...base, sort: "oldest" }));
    expect(filterKey(base)).not.toBe(filterKey({ ...base, starred: true }));
  });
});
