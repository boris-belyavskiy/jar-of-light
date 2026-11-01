import { describe, expect, it } from "vitest";
import { displayDate } from "@/lib/time";

describe("displayDate", () => {
  it("shows MM-DD-YYYY in English and DD.MM.YYYY in Russian", () => {
    expect(displayDate("2026-10-31", "en")).toBe("10-31-2026");
    expect(displayDate("2026-10-31", "ru")).toBe("31.10.2026");
  });
});
