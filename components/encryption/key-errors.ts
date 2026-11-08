import { CryptoError } from "@/lib/crypto";
import { KeyStoreError } from "./key-provider";

/**
 * The message key (under `encryption.errors`) for whatever went wrong. Only
 * codes are looked at, never message text, and nothing is logged: a wrong
 * password or code is an expected answer, not an incident.
 */
export function keyErrorKey(error: unknown): string {
  if (error instanceof CryptoError) {
    switch (error.code) {
      case "wrong_password":
        return "wrongPassword";
      case "bad_recovery_code":
        return "wrongCode";
      case "weak_password":
        return "tooShort";
      default:
        return "generic";
    }
  }
  if (error instanceof KeyStoreError) return error.code === "exists" ? "exists" : "save";
  return "generic";
}
