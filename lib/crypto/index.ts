/**
 * End-to-end encryption of journal content (ADR-0011, Tech Spec 5.6). Runs only
 * in the browser: it needs Web Crypto and stays away from server code.
 */
export { CryptoError, type CryptoErrorCode } from "./errors";
export { decryptField, encryptField, type FieldContext } from "./field";
export { calibrateKdf, DEFAULT_KDF, type KdfParams } from "./kdf";
export {
  changePassword,
  createKeys,
  generateRecoveryCode,
  MIN_PASSWORD_LENGTH,
  normalizeRecoveryCode,
  replaceRecoveryCode,
  resetPasswordWithCode,
  unlockWithPassword,
  unlockWithRecoveryCode,
  validatePassword,
  type KeyRecord,
} from "./keys";
