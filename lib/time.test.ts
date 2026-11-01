import { describe, expect, it } from "vitest";
import { displayDate, entryDateLabel } from "@/lib/time";

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
