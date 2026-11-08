import { describe, expect, it } from "vitest";
import { categoryLabel } from "@/components/journal/category-label";

const t = (key: string) => `[${key}]`;

describe("categoryLabel", () => {
  it("shows a custom name in the interface language, else the other one", () => {
    const both = { slug: null, nameRu: "Прогулки", nameEn: "Walks" };
    expect(categoryLabel(both, t, "ru")).toBe("Прогулки");
    expect(categoryLabel(both, t, "en")).toBe("Walks");
    expect(categoryLabel({ slug: null, nameRu: "Прогулки", nameEn: null }, t, "en")).toBe("Прогулки");
  });

  it("says a name is locked when it exists only as ciphertext (ADR-0011)", () => {
    const locked = { slug: null, nameRu: null, nameEn: null, locked: true };
    expect(categoryLabel(locked, t, "en")).toBe("[locked]");
    expect(categoryLabel({ ...locked, nameRu: "Прогулки" }, t, "en")).toBe("Прогулки");
    expect(categoryLabel({ slug: "family", nameRu: null, nameEn: null, locked: true }, t, "en")).toBe("[system.family]");
  });

  it("shows a built-in category's translation unless the user renamed it in that language", () => {
    expect(categoryLabel({ slug: "family", nameRu: null, nameEn: null }, t, "en")).toBe("[system.family]");
    expect(categoryLabel({ slug: "family", nameRu: "Родные", nameEn: null }, t, "ru")).toBe("Родные");
    expect(categoryLabel({ slug: "family", nameRu: "Родные", nameEn: null }, t, "en")).toBe("[system.family]");
  });
});
