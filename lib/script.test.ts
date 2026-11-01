import { describe, expect, it } from "vitest";
import { detectScript } from "@/lib/script";

describe("detectScript", () => {
  it("tells Cyrillic from Latin", () => {
    expect(detectScript("Прогулки")).toBe("ru");
    expect(detectScript("Ёлка 2")).toBe("ru");
    expect(detectScript("Walks")).toBe("en");
  });

  it("leaves mixed and letterless text where it was typed", () => {
    expect(detectScript("Йога и yoga")).toBeNull();
    expect(detectScript("2026 ☀️")).toBeNull();
    expect(detectScript("")).toBeNull();
  });
});
