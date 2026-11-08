import { CryptoError } from "./errors";
import { randomBytes, utf8 } from "./encoding";

/** Argon2id settings, stored per user so any device derives the same key. `m` is memory in KiB. */
export type KdfParams = { alg: "argon2id"; m: number; t: number; p: number };

/** OWASP's minimum Argon2id settings: any one of these, or stronger in both memory and time. */
const OWASP_MINIMUMS = [
  { m: 47104, t: 1 },
  { m: 19456, t: 2 },
  { m: 12288, t: 3 },
  { m: 9216, t: 4 },
  { m: 7168, t: 5 },
];
/** Above this a hostile server could make a device freeze; nobody needs more. */
const MAX_MEMORY_KIB = 262_144;
const MAX_ITERATIONS = 10;
const MAX_PARALLELISM = 4;

/** Tried from the strongest down; the first that is fast enough on this device is used. */
const LADDER: KdfParams[] = [
  { alg: "argon2id", m: 65_536, t: 3, p: 1 },
  { alg: "argon2id", m: 65_536, t: 2, p: 1 },
  { alg: "argon2id", m: 47_104, t: 1, p: 1 },
  { alg: "argon2id", m: 19_456, t: 2, p: 1 },
];
export const DEFAULT_KDF: KdfParams = LADDER[0];
export const WEAKEST_KDF: KdfParams = LADDER[LADDER.length - 1];

export function assertAcceptableKdf(params: unknown): asserts params is KdfParams {
  const p = params as Partial<KdfParams> | null;
  const ok =
    p !== null &&
    typeof p === "object" &&
    p.alg === "argon2id" &&
    Number.isInteger(p.m) &&
    Number.isInteger(p.t) &&
    Number.isInteger(p.p) &&
    p.m! <= MAX_MEMORY_KIB &&
    p.t! <= MAX_ITERATIONS &&
    p.p! >= 1 &&
    p.p! <= MAX_PARALLELISM &&
    OWASP_MINIMUMS.some((min) => p.m! >= min.m && p.t! >= min.t);
  if (!ok) throw new CryptoError("bad_params");
}

/** The password as typed, in one canonical form, so the same letter typed two ways is the same password. */
export function normalizePassword(password: string): string {
  return password.normalize("NFKC");
}

/** Turns a password into a key that locks the data key. Slow on purpose. */
export async function deriveKek(password: string, salt: Uint8Array<ArrayBuffer>, params: KdfParams): Promise<CryptoKey> {
  assertAcceptableKdf(params);
  // Loaded on first use: the WebAssembly module is not part of every page.
  const { argon2id } = await import("hash-wasm");
  const raw = await argon2id({
    password: utf8(normalizePassword(password)),
    salt,
    parallelism: params.p,
    iterations: params.t,
    memorySize: params.m,
    hashLength: 32,
    outputType: "binary",
  });
  const bytes = new Uint8Array(raw); // a plain ArrayBuffer, which Web Crypto accepts
  try {
    return await crypto.subtle.importKey("raw", bytes, "AES-GCM", false, ["encrypt", "decrypt"]);
  } finally {
    raw.fill(0);
    bytes.fill(0);
  }
}

/** The strongest rung whose measured time fits the target; the weakest allowed one if none does. */
export async function pickKdfParams(measureMs: (params: KdfParams) => Promise<number>, targetMs = 1000): Promise<KdfParams> {
  for (const params of LADDER.slice(0, -1)) {
    if ((await measureMs(params)) <= targetMs) return params;
  }
  return WEAKEST_KDF;
}

/** Measures real derivations on this device (about a second each at the top). */
export function calibrateKdf(targetMs = 1000): Promise<KdfParams> {
  return pickKdfParams(async (params) => {
    const start = performance.now();
    await deriveKek("calibration", randomBytes(16), params);
    return performance.now() - start;
  }, targetMs);
}
