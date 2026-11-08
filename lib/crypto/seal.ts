import { CryptoError } from "./errors";
import { concat, fromBase64Url, randomBytes, toBase64Url, utf8 } from "./encoding";

/**
 * The one way this app encrypts anything: AES-256-GCM with a fresh random
 * 96-bit nonce, and additional authenticated data (AAD) that must be the same
 * when opening. A sealed value is `v1.` + base64url(nonce + ciphertext + tag).
 * Changing the version means changing the prefix and the AAD together, so old
 * values stay readable by the code that knows them.
 */
export const FORMAT_VERSION = "v1";
const NONCE_BYTES = 12;
const TAG_BYTES = 16;

/** The AAD: a fixed text that says what this value is and where it belongs. */
export function aad(...parts: (string | number)[]): Uint8Array<ArrayBuffer> {
  return utf8(JSON.stringify(["jol", 1, ...parts]));
}

export async function seal(key: CryptoKey, plaintext: Uint8Array<ArrayBuffer>, additionalData: Uint8Array<ArrayBuffer>) {
  const nonce = randomBytes(NONCE_BYTES);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce, additionalData, tagLength: TAG_BYTES * 8 }, key, plaintext),
  );
  return `${FORMAT_VERSION}.${toBase64Url(concat(nonce, ciphertext))}`;
}

export async function open(key: CryptoKey, sealed: string, additionalData: Uint8Array<ArrayBuffer>) {
  const dot = sealed.indexOf(".");
  if (dot < 0 || sealed.slice(0, dot) !== FORMAT_VERSION) throw new CryptoError("bad_format");
  const bytes = fromBase64Url(sealed.slice(dot + 1));
  if (bytes.length < NONCE_BYTES + TAG_BYTES) throw new CryptoError("bad_format");
  try {
    return new Uint8Array(
      await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: bytes.subarray(0, NONCE_BYTES), additionalData, tagLength: TAG_BYTES * 8 },
        key,
        bytes.subarray(NONCE_BYTES),
      ),
    );
  } catch {
    throw new CryptoError("decrypt_failed");
  }
}
