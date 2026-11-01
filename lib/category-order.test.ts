import { describe, expect, it } from "vitest";
import { isSameSet, sortByOrder } from "@/lib/category-order";

const items = ["a", "b", "c", "d"].map((id) => ({ id }));
const ids = (list: { id: string }[]) => list.map((x) => x.id);

describe("sortByOrder", () => {
  it("keeps the default order when nothing is stored", () => {
    expect(ids(sortByOrder(items, []))).toEqual(["a", "b", "c", "d"]);
  });

  it("puts ordered ids first and the rest after them in default order", () => {
    expect(ids(sortByOrder(items, ["c", "a"]))).toEqual(["c", "a", "b", "d"]);
  });

  it("ignores ids of deleted categories", () => {
    expect(ids(sortByOrder(items, ["gone", "d", "b"]))).toEqual(["d", "b", "a", "c"]);
  });
});

describe("isSameSet", () => {
  it("accepts a reordering of the same ids", () => {
    expect(isSameSet(["c", "a", "b"], ["a", "b", "c"])).toBe(true);
  });

  it("rejects missing, extra, foreign or repeated ids", () => {
    expect(isSameSet(["a", "b"], ["a", "b", "c"])).toBe(false);
    expect(isSameSet(["a", "b", "c", "d"], ["a", "b", "c"])).toBe(false);
    expect(isSameSet(["a", "b", "x"], ["a", "b", "c"])).toBe(false);
    expect(isSameSet(["a", "a", "b"], ["a", "b", "c"])).toBe(false);
  });
});
