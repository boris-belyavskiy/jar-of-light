import { CryptoError } from "./errors";
import { fromBase64Url, randomBytes, toBase64Url, utf8 } from "./encoding";
import { DEFAULT_KDF, deriveKek, normalizePassword, type KdfParams } from "./kdf";
import { aad, open, seal } from "./seal";

/**
 * One random data key per user encrypts everything. It is stored only wrapped
 * (encrypted), twice: by a key made from the diary password, and by a key made
 * from the recovery code. This is what the `user_keys` table holds; the server
 * never sees a password, a code, or the data key itself (Tech Spec 5.6).
 */
export type KeyRecord = {
  keyVersion: number;
  /** Base64url salt for the password's Argon2id. */
  kdfSalt: string;
  kdfParams: KdfParams;
  wrappedKeyPassword: string;
  wrappedKeyRecovery: string;
};

export const KEY_VERSION = 1;
export const MIN_PASSWORD_LENGTH = 8;
const DATA_KEY_BYTES = 32;
const SALT_BYTES = 16;

export function validatePassword(password: string): void {
  if ([...normalizePassword(password)].length < MIN_PASSWORD_LENGTH) throw new CryptoError("weak_password");
}

const wrapAad = (userId: string, keyVersion: number, purpose: "password" | "recovery") =>
  aad("key", userId, keyVersion, purpose);

/** The data key as a CryptoKey that cannot be exported again: scripts can use it but not read it. */
function importDataKey(bytes: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", bytes, "AES-GCM", false, ["encrypt", "decrypt"]);
}

// --- The recovery code ------------------------------------------------------

/** Crockford base32: no I, L, O or U, so a code copied by hand is hard to misread. */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const CODE_LENGTH = 28; // 28 symbols x 5 bits = 140 bits
const CODE_GROUP = 4;

/** A new recovery code, shown to the user once as seven groups of four: XXXX-XXXX-… */
export function generateRecoveryCode(): string {
  const symbols = Array.from(randomBytes(CODE_LENGTH), (b) => ALPHABET[b & 31]); // 256 is a multiple of 32: no bias
  const groups: string[] = [];
  for (let i = 0; i < CODE_LENGTH; i += CODE_GROUP) groups.push(symbols.slice(i, i + CODE_GROUP).join(""));
  return groups.join("-");
}

/** What the user typed, in the form the code was made in; throws when it cannot be a recovery code. */
export function normalizeRecoveryCode(input: string): string {
  const code = input
    .toUpperCase()
    .replace(/[\s-]/g, "")
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1");
  if (code.length !== CODE_LENGTH || [...code].some((c) => !ALPHABET.includes(c))) {
    throw new CryptoError("bad_recovery_code");
  }
  return code;
}

/** The code already carries 140 random bits, so a fast key derivation is enough. */
async function recoveryKek(code: string): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey("raw", utf8(normalizeRecoveryCode(code)), "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: utf8("jar-of-light/recovery/v1"), info: utf8("wrap data key") },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

// --- Making, opening and re-wrapping ----------------------------------------

async function passwordKek(password: string, record: Pick<KeyRecord, "kdfSalt" | "kdfParams">) {
  return deriveKek(password, fromBase64Url(record.kdfSalt), record.kdfParams);
}

/** The raw data key from the password wrap. The caller zeroes the bytes after use. */
async function dataKeyFromPassword(record: KeyRecord, userId: string, password: string) {
  const kek = await passwordKek(password, record);
  try {
    return await open(kek, record.wrappedKeyPassword, wrapAad(userId, record.keyVersion, "password"));
  } catch (error) {
    if (error instanceof CryptoError && error.code === "decrypt_failed") throw new CryptoError("wrong_password");
    throw error;
  }
}

async function dataKeyFromCode(record: KeyRecord, userId: string, code: string) {
  const kek = await recoveryKek(code); // throws bad_recovery_code for something that cannot be a code
  try {
    return await open(kek, record.wrappedKeyRecovery, wrapAad(userId, record.keyVersion, "recovery"));
  } catch (error) {
    if (error instanceof CryptoError && error.code === "decrypt_failed") throw new CryptoError("bad_recovery_code");
    throw error;
  }
}

/** Sets up a user's encryption: a new data key and its two wraps. Returns what to store and show. */
export async function createKeys(args: {
  userId: string;
  password: string;
  kdfParams?: KdfParams;
}): Promise<{ record: KeyRecord; recoveryCode: string; dataKey: CryptoKey }> {
  validatePassword(args.password);
  const kdfParams = args.kdfParams ?? DEFAULT_KDF;
  const dataKeyBytes = randomBytes(DATA_KEY_BYTES);
  try {
    const salt = randomBytes(SALT_BYTES);
    const recoveryCode = generateRecoveryCode();
    const record: KeyRecord = {
      keyVersion: KEY_VERSION,
      kdfSalt: toBase64Url(salt),
      kdfParams,
      wrappedKeyPassword: await seal(
        await deriveKek(args.password, salt, kdfParams),
        dataKeyBytes,
        wrapAad(args.userId, KEY_VERSION, "password"),
      ),
      wrappedKeyRecovery: await seal(
        await recoveryKek(recoveryCode),
        dataKeyBytes,
        wrapAad(args.userId, KEY_VERSION, "recovery"),
      ),
    };
    return { record, recoveryCode, dataKey: await importDataKey(dataKeyBytes) };
  } finally {
    dataKeyBytes.fill(0);
  }
}

export async function unlockWithPassword(record: KeyRecord, userId: string, password: string): Promise<CryptoKey> {
  const bytes = await dataKeyFromPassword(record, userId, password);
  try {
    return await importDataKey(bytes);
  } finally {
    bytes.fill(0);
  }
}

export async function unlockWithRecoveryCode(record: KeyRecord, userId: string, code: string): Promise<CryptoKey> {
  const bytes = await dataKeyFromCode(record, userId, code);
  try {
    return await importDataKey(bytes);
  } finally {
    bytes.fill(0);
  }
}

/** Wraps the data key again with a new password (a new salt, and settings measured on this device). */
async function rewrapPassword(record: KeyRecord, userId: string, bytes: Uint8Array<ArrayBuffer>, newPassword: string, kdfParams: KdfParams) {
  validatePassword(newPassword);
  const salt = randomBytes(SALT_BYTES);
  return {
    ...record,
    kdfSalt: toBase64Url(salt),
    kdfParams,
    wrappedKeyPassword: await seal(
      await deriveKek(newPassword, salt, kdfParams),
      bytes,
      wrapAad(userId, record.keyVersion, "password"),
    ),
  } satisfies KeyRecord;
}

/** Change of diary password: the data key is the same, so no entry is touched. */
export async function changePassword(args: {
  record: KeyRecord;
  userId: string;
  currentPassword: string;
  newPassword: string;
  kdfParams?: KdfParams;
}): Promise<KeyRecord> {
  const bytes = await dataKeyFromPassword(args.record, args.userId, args.currentPassword);
  try {
    return await rewrapPassword(args.record, args.userId, bytes, args.newPassword, args.kdfParams ?? args.record.kdfParams);
  } finally {
    bytes.fill(0);
  }
}

/** A forgotten password: the recovery code opens the data key and a new password wraps it. */
export async function resetPasswordWithCode(args: {
  record: KeyRecord;
  userId: string;
  code: string;
  newPassword: string;
  kdfParams?: KdfParams;
}): Promise<KeyRecord> {
  const bytes = await dataKeyFromCode(args.record, args.userId, args.code);
  try {
    return await rewrapPassword(args.record, args.userId, bytes, args.newPassword, args.kdfParams ?? args.record.kdfParams);
  } finally {
    bytes.fill(0);
  }
}

/** A new recovery code; the old one stops working. Needs the password so a stolen open session cannot do it. */
export async function replaceRecoveryCode(args: {
  record: KeyRecord;
  userId: string;
  password: string;
}): Promise<{ record: KeyRecord; recoveryCode: string }> {
  const bytes = await dataKeyFromPassword(args.record, args.userId, args.password);
  try {
    const recoveryCode = generateRecoveryCode();
    const wrappedKeyRecovery = await seal(
      await recoveryKek(recoveryCode),
      bytes,
      wrapAad(args.userId, args.record.keyVersion, "recovery"),
    );
    return { record: { ...args.record, wrappedKeyRecovery }, recoveryCode };
  } finally {
    bytes.fill(0);
  }
}
