import { describe, expect, it } from "vitest";
import { displayDate, entryDateLabel, formatUtcOffset, timeZoneOptions, utcOffsetMinutes } from "@/lib/time";

describe("displayDate", () => {
  it("shows MM-DD-YYYY in English and DD.MM.YYYY in Russian", () => {
    expect(displayDate("2026-10-31", "en")).toBe("10-31-2026");
    expect(displayDate("2026-10-31", "ru")).toBe("31.10.2026");
  });
});

describe("entryDateLabel", () => {
  it("keeps the entry's own local date whatever the server's time zone", () => {
    expect(entryDateLabel("2026-10-23", "21:00", "en")).toBe("October 23, 2026 · 21:00");
    expect(entryDateLabel("2026-01-01", "00:05", "ru")).toBe("1 января 2026 г. · 00:05");
  });
});

describe("time zones with UTC offsets", () => {
  const winter = new Date("2026-01-15T12:00:00Z");
  const summer = new Date("2026-07-15T12:00:00Z");

  it("reads the offset, following daylight saving time", () => {
    expect(utcOffsetMinutes("Europe/Moscow", winter)).toBe(180);
    expect(utcOffsetMinutes("America/New_York", winter)).toBe(-300);
    expect(utcOffsetMinutes("America/New_York", summer)).toBe(-240);
    expect(utcOffsetMinutes("Asia/Kolkata", winter)).toBe(330);
    expect(utcOffsetMinutes("UTC", winter)).toBe(0);
  });

  it("formats offsets and sorts zones west to east", () => {
    expect(formatUtcOffset(-300)).toBe("UTC−05:00");
    expect(formatUtcOffset(0)).toBe("UTC+00:00");
    expect(timeZoneOptions(["Europe/Moscow", "America/New_York", "UTC"], winter)).toEqual([
      { value: "America/New_York", label: "(UTC−05:00) America/New York" },
      { value: "UTC", label: "(UTC+00:00) UTC" },
      { value: "Europe/Moscow", label: "(UTC+03:00) Europe/Moscow" },
    ]);
  });
});
