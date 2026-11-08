/**
 * Every failure carries only a code: never a key, a password, a code or a
 * piece of decrypted text (ADR-0011), so an error can be logged or reported safely.
 */
export type CryptoErrorCode =
  | "bad_format" // not something this module produced
  | "decrypt_failed" // wrong key, or the data was changed or moved
  | "wrong_password"
  | "bad_recovery_code"
  | "bad_params" // key derivation settings outside what this app accepts
  | "weak_password";

export class CryptoError extends Error {
  constructor(readonly code: CryptoErrorCode) {
    super(code);
    this.name = "CryptoError";
  }
}
