import { describe, expect, it } from "vitest";
import { passwordStrength } from "@/lib/password-strength";

describe("passwordStrength", () => {
  it("calls short and very common passwords weak", () => {
    for (const p of ["", "short", "1234567", "password", "Password1", "12345678", "11111111", "aaaaaaaaaaaa"]) {
      expect(passwordStrength(p)).toBe("weak");
    }
  });

  it("calls an 8 to 9 character password weak even with a mix of characters", () => {
    expect(passwordStrength("Tr0ub4d&")).toBe("weak");
  });

  it("calls a longer or more varied password fair", () => {
    expect(passwordStrength("sunnymorning")).toBe("fair"); // 12 letters
    expect(passwordStrength("Sunny#2026")).toBe("fair"); // 10 characters, three kinds
  });

  it("calls a phrase of several words, or a long password, strong", () => {
    expect(passwordStrength("blue kettle sings softly")).toBe("strong");
    expect(passwordStrength("correct horse battery")).toBe("strong");
    expect(passwordStrength("abcdefghijklmnopqrst")).toBe("strong"); // 20 characters
  });

  it("counts characters in any alphabet, not bytes", () => {
    expect(passwordStrength("зимний вечер у реки")).toBe("strong");
    expect(passwordStrength("пароль")).toBe("weak");
    expect(passwordStrength("🌞🌞🌞🌞🌞🌞🌞🌞🌞🌞")).toBe("weak"); // one repeated symbol
  });
});
