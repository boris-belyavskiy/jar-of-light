import { describe, expect, it } from "vitest";
import { localeFromAcceptLanguage } from "@/i18n/config";
import { nowInTimeZone } from "@/lib/time";
import { categoryNameSchema, charCount, entrySchema } from "@/lib/validation";

const valid = { body: "Coffee with Mom", occurredOn: "2026-10-27", occurredTime: "09:30", categoryIds: [] };

describe("entrySchema", () => {
  it("accepts a normal entry and trims the text", () => {
    expect(entrySchema.parse({ ...valid, body: "  hi  " }).body).toBe("hi");
  });

  it("rejects empty text", () => {
    expect(entrySchema.safeParse({ ...valid, body: "   " }).success).toBe(false);
  });

  it("allows exactly 4,000 characters and rejects 4,001", () => {
    expect(entrySchema.safeParse({ ...valid, body: "a".repeat(4000) }).success).toBe(true);
    expect(entrySchema.safeParse({ ...valid, body: "a".repeat(4001) }).success).toBe(false);
  });

  it("counts an emoji as one character, like Postgres", () => {
    expect(charCount("☀️")).toBe(2); // sun + variation selector: two code points
    expect(charCount("😀")).toBe(1);
    expect(entrySchema.safeParse({ ...valid, body: "😀".repeat(4000) }).success).toBe(true);
  });

  it("rejects malformed dates and times", () => {
    expect(entrySchema.safeParse({ ...valid, occurredOn: "27.10.2026" }).success).toBe(false);
    expect(entrySchema.safeParse({ ...valid, occurredTime: "24:00" }).success).toBe(false);
  });

  it("rejects non-uuid category ids", () => {
    expect(entrySchema.safeParse({ ...valid, categoryIds: ["family"] }).success).toBe(false);
  });
});

describe("time zones", () => {
  const now = new Date("2026-10-27T23:30:00Z");

  it("gives the local date and time in the user's zone", () => {
    expect(nowInTimeZone("UTC", now)).toEqual({ date: "2026-10-27", time: "23:30" });
    expect(nowInTimeZone("Europe/Moscow", now)).toEqual({ date: "2026-10-28", time: "02:30" });
    expect(nowInTimeZone("America/Los_Angeles", now)).toEqual({ date: "2026-10-27", time: "16:30" });
  });

});

describe("categoryNameSchema", () => {
  it("trims and limits to 40 characters", () => {
    expect(categoryNameSchema.parse("  Travel ")).toBe("Travel");
    expect(categoryNameSchema.safeParse("x".repeat(41)).success).toBe(false);
    expect(categoryNameSchema.safeParse(" ").success).toBe(false);
  });
});

describe("localeFromAcceptLanguage", () => {
  it("picks Russian or English and falls back to English", () => {
    expect(localeFromAcceptLanguage("ru-RU,ru;q=0.9,en;q=0.8")).toBe("ru");
    expect(localeFromAcceptLanguage("de-DE,en;q=0.5")).toBe("en");
    expect(localeFromAcceptLanguage(null)).toBe("en");
  });
});
