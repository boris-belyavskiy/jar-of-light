/**
 * A rough hint, not a rule: the diary password only has to be 8 characters
 * long (ADR-0011), but the operator is the one who could guess it offline, so
 * setup shows how strong a password is and suggests a phrase of several words
 * (ADR-0013). Judges length first, then variety; a few of the most common
 * passwords are always weak.
 */
export type Strength = "weak" | "fair" | "strong";

const COMMON = new Set([
  "password",
  "password1",
  "password123",
  "12345678",
  "123456789",
  "1234567890",
  "qwertyuiop",
  "qwerty123",
  "qwertyui",
  "1q2w3e4r",
  "iloveyou",
  "letmein1",
  "abc12345",
  "11111111",
  "00000000",
  "пароль12",
  "пароль123",
  "йцукенгш",
  "12345678q",
]);

export function passwordStrength(password: string): Strength {
  const chars = [...password.normalize("NFKC")];
  const length = chars.length;
  if (length < 8 || COMMON.has(password.toLowerCase()) || new Set(chars).size <= 3) return "weak";

  const classes = [
    chars.some((c) => c !== c.toUpperCase()), // a lowercase letter, in any alphabet
    chars.some((c) => c !== c.toLowerCase()), // an uppercase letter
    chars.some((c) => /\d/.test(c)),
    chars.some((c) => !/[\p{L}\d]/u.test(c)), // a space or a symbol
  ].filter(Boolean).length;
  const words = password.split(/\s+/).filter((w) => [...w].length >= 2).length;

  if (length >= 20 || (length >= 16 && (words >= 3 || classes >= 3))) return "strong";
  if (length >= 12 || (length >= 10 && classes >= 3)) return "fair";
  return "weak";
}
