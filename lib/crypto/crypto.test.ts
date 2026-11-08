import { beforeAll, describe, expect, it } from "vitest";
import {
  changePassword,
  CryptoError,
  createKeys,
  decryptField,
  encryptField,
  generateRecoveryCode,
  normalizeRecoveryCode,
  replaceRecoveryCode,
  resetPasswordWithCode,
  unlockWithPassword,
  unlockWithRecoveryCode,
  type CryptoErrorCode,
  type FieldContext,
  type KdfParams,
  type KeyRecord,
} from "@/lib/crypto";
import { assertAcceptableKdf, pickKdfParams, WEAKEST_KDF } from "@/lib/crypto/kdf";

// The smallest settings the app accepts keep the tests fast; the real default is far heavier.
const FAST: KdfParams = WEAKEST_KDF;
const USER = "00000000-0000-4000-8000-00000000000a";
const OTHER_USER = "00000000-0000-4000-8000-00000000000b";
const ROW = "11111111-1111-4111-8111-111111111111";
const PASSWORD = "correct horse battery staple";
const ctx: FieldContext = { userId: USER, table: "entries", rowId: ROW, field: "body" };

async function codeOf(promise: Promise<unknown>): Promise<CryptoErrorCode | "no error"> {
  try {
    await promise;
    return "no error";
  } catch (error) {
    if (error instanceof CryptoError) return error.code;
    throw error;
  }
}

let dataKey: CryptoKey;
let record: KeyRecord;
let recoveryCode: string;

beforeAll(async () => {
  ({ dataKey, record, recoveryCode } = await createKeys({ userId: USER, password: PASSWORD, kdfParams: FAST }));
}, 30_000);

describe("encrypting a field", () => {
  it("decrypts what it encrypted, in any script, emoji included", async () => {
    for (const text of ["Thank you, Anna.", "Спасибо за тёплый вечер ☀️", "日本語のテキスト 🎉", "a\nb\n\nc", ""]) {
      expect(await decryptField(dataKey, await encryptField(dataKey, text, ctx), ctx)).toBe(text);
    }
  });

  it("gives a different result every time and never contains the text", async () => {
    const a = await encryptField(dataKey, "the same words", ctx);
    const b = await encryptField(dataKey, "the same words", ctx);
    expect(a).not.toBe(b);
    expect(a.startsWith("v1.")).toBe(true);
    expect(a).not.toContain("same");
  });

  it("fails when any character of the ciphertext is changed", async () => {
    const sealed = await encryptField(dataKey, "a secret", ctx);
    const i = sealed.length - 3;
    const changed = sealed.slice(0, i) + (sealed[i] === "A" ? "B" : "A") + sealed.slice(i + 1);
    expect(await codeOf(decryptField(dataKey, changed, ctx))).toBe("decrypt_failed");
  });

  it("fails when moved to another row, field, table or user", async () => {
    const sealed = await encryptField(dataKey, "a secret", ctx);
    for (const moved of [
      { ...ctx, rowId: "22222222-2222-4222-8222-222222222222" },
      { ...ctx, field: "name_ru" },
      { ...ctx, table: "categories" as const },
      { ...ctx, userId: OTHER_USER },
    ]) {
      expect(await codeOf(decryptField(dataKey, sealed, moved))).toBe("decrypt_failed");
    }
  });

  it("fails with another key", async () => {
    const other = await createKeys({ userId: USER, password: PASSWORD, kdfParams: FAST });
    const sealed = await encryptField(dataKey, "a secret", ctx);
    expect(await codeOf(decryptField(other.dataKey, sealed, ctx))).toBe("decrypt_failed");
  });

  it("rejects values that are not ours or are cut short", async () => {
    const sealed = await encryptField(dataKey, "a secret", ctx);
    for (const bad of ["", "plain text", "v2." + sealed.slice(3), sealed.slice(0, 10), "v1.!!!"]) {
      expect(await codeOf(decryptField(dataKey, bad, ctx))).toBe("bad_format");
    }
  });

  it("keeps the longest allowed text and name inside the database's size limits", async () => {
    const body = await encryptField(dataKey, "🎉".repeat(4000), ctx); // 4,000 characters of 4 bytes each
    const name = await encryptField(dataKey, "🎉".repeat(40), { ...ctx, table: "categories", field: "name_en" });
    expect(body.length).toBeLessThanOrEqual(24_000); // entries.body_enc check
    expect(name.length).toBeLessThanOrEqual(512); // categories.name_*_enc check
  });

  it("the data key cannot be read back out of the browser", async () => {
    await expect(crypto.subtle.exportKey("raw", dataKey)).rejects.toThrow();
  });

  it("errors carry a code and nothing of the text", async () => {
    const error = await decryptField(dataKey, "v1.AAAA", ctx).catch((e) => e);
    expect(error).toBeInstanceOf(CryptoError);
    expect(error.message).toBe(error.code);
  });
});

describe("the diary password", () => {
  it("opens the same data key on another device", async () => {
    const sealed = await encryptField(dataKey, "written on the first device", ctx);
    const unlocked = await unlockWithPassword(record, USER, PASSWORD);
    expect(await decryptField(unlocked, sealed, ctx)).toBe("written on the first device");
  });

  it("fails cleanly when the password is wrong", async () => {
    expect(await codeOf(unlockWithPassword(record, USER, "wrong password here"))).toBe("wrong_password");
  });

  it("does not open another user's wrapped key, even with the right password", async () => {
    expect(await codeOf(unlockWithPassword(record, OTHER_USER, PASSWORD))).toBe("wrong_password");
  });

  it("treats the same password typed in different Unicode forms as one", async () => {
    const composed = "café au lait 2026"; // é as one character
    const decomposed = "café au lait 2026"; // e followed by a combining accent
    const keys = await createKeys({ userId: USER, password: composed, kdfParams: FAST });
    const sealed = await encryptField(keys.dataKey, "x", ctx);
    const unlocked = await unlockWithPassword(keys.record, USER, decomposed);
    expect(await decryptField(unlocked, sealed, ctx)).toBe("x");
  });

  it("refuses a password shorter than 8 characters, counting characters and not bytes", async () => {
    expect(await codeOf(createKeys({ userId: USER, password: "short", kdfParams: FAST }))).toBe("weak_password");
    expect(await codeOf(createKeys({ userId: USER, password: "1234567", kdfParams: FAST }))).toBe("weak_password");
    expect(await codeOf(createKeys({ userId: USER, password: "пароль12", kdfParams: FAST }))).toBe("no error");
  });

  it("changes without touching what was encrypted, and the old password stops working", async () => {
    const sealed = await encryptField(dataKey, "before the change", ctx);
    const changed = await changePassword({
      record,
      userId: USER,
      currentPassword: PASSWORD,
      newPassword: "a brand new password",
    });
    expect(changed.kdfSalt).not.toBe(record.kdfSalt);
    expect(await codeOf(unlockWithPassword(changed, USER, PASSWORD))).toBe("wrong_password");
    const unlocked = await unlockWithPassword(changed, USER, "a brand new password");
    expect(await decryptField(unlocked, sealed, ctx)).toBe("before the change");
    // The recovery code still works after a password change.
    expect(await codeOf(unlockWithRecoveryCode(changed, USER, recoveryCode))).toBe("no error");
  });

  it("is not changed by someone who does not know the current one", async () => {
    expect(
      await codeOf(changePassword({ record, userId: USER, currentPassword: "not the password", newPassword: "another new one" })),
    ).toBe("wrong_password");
  });
});

describe("the recovery code", () => {
  it("is 28 characters in seven groups, from an alphabet without look-alikes, and new every time", () => {
    const code = generateRecoveryCode();
    expect(code).toMatch(/^([0-9A-HJKMNP-TV-Z]{4}-){6}[0-9A-HJKMNP-TV-Z]{4}$/);
    expect(generateRecoveryCode()).not.toBe(code);
  });

  it("opens the same data key", async () => {
    const sealed = await encryptField(dataKey, "kept safe", ctx);
    const unlocked = await unlockWithRecoveryCode(record, USER, recoveryCode);
    expect(await decryptField(unlocked, sealed, ctx)).toBe("kept safe");
  });

  it("is forgiving about case, spaces, dashes and look-alike letters", async () => {
    const sloppy = recoveryCode.toLowerCase().replace(/-/g, " ").replace(/0/g, "o").replace(/1/g, "l");
    expect(normalizeRecoveryCode(sloppy)).toBe(normalizeRecoveryCode(recoveryCode));
    expect(await codeOf(unlockWithRecoveryCode(record, USER, sloppy))).toBe("no error");
  });

  it("fails cleanly when wrong, too short or not a code at all", async () => {
    const wrong = generateRecoveryCode();
    expect(await codeOf(unlockWithRecoveryCode(record, USER, wrong))).toBe("bad_recovery_code");
    expect(await codeOf(unlockWithRecoveryCode(record, USER, "ABCD-EFGH"))).toBe("bad_recovery_code");
    expect(await codeOf(unlockWithRecoveryCode(record, USER, "!".repeat(28)))).toBe("bad_recovery_code");
    expect(await codeOf(unlockWithRecoveryCode(record, OTHER_USER, recoveryCode))).toBe("bad_recovery_code");
  });

  it("sets a new password when the old one is forgotten", async () => {
    const sealed = await encryptField(dataKey, "survives a forgotten password", ctx);
    const reset = await resetPasswordWithCode({ record, userId: USER, code: recoveryCode, newPassword: "fresh start 2026" });
    const unlocked = await unlockWithPassword(reset, USER, "fresh start 2026");
    expect(await decryptField(unlocked, sealed, ctx)).toBe("survives a forgotten password");
    expect(await codeOf(unlockWithPassword(reset, USER, PASSWORD))).toBe("wrong_password");
  });

  it("can be replaced with the password; the old code then stops working", async () => {
    const replaced = await replaceRecoveryCode({ record, userId: USER, password: PASSWORD });
    expect(replaced.recoveryCode).not.toBe(recoveryCode);
    expect(await codeOf(unlockWithRecoveryCode(replaced.record, USER, recoveryCode))).toBe("bad_recovery_code");
    const sealed = await encryptField(dataKey, "same key underneath", ctx);
    const unlocked = await unlockWithRecoveryCode(replaced.record, USER, replaced.recoveryCode);
    expect(await decryptField(unlocked, sealed, ctx)).toBe("same key underneath");
    expect(await codeOf(replaceRecoveryCode({ record, userId: USER, password: "not the password" }))).toBe("wrong_password");
  });
});

describe("key derivation settings", () => {
  it("accepts the app's settings and refuses weaker or absurdly heavy ones", () => {
    const check = (p: unknown) => {
      try {
        assertAcceptableKdf(p);
        return true;
      } catch {
        return false;
      }
    };
    expect(check({ alg: "argon2id", m: 65_536, t: 3, p: 1 })).toBe(true);
    expect(check(FAST)).toBe(true);
    expect(check({ alg: "argon2id", m: 4096, t: 3, p: 1 })).toBe(false); // weaker than OWASP's minimum
    expect(check({ alg: "argon2id", m: 19_456, t: 1, p: 1 })).toBe(false);
    expect(check({ alg: "argon2id", m: 4_000_000, t: 3, p: 1 })).toBe(false); // would freeze a phone
    expect(check({ alg: "argon2id", m: 65_536, t: 3, p: 99 })).toBe(false);
    expect(check({ alg: "pbkdf2", m: 65_536, t: 3, p: 1 })).toBe(false);
    expect(check(null)).toBe(false);
    expect(check("argon2id")).toBe(false);
  });

  it("refuses to unlock with settings a server has tampered with", async () => {
    const hostile = { ...record, kdfParams: { ...record.kdfParams, m: 4_000_000 } };
    expect(await codeOf(unlockWithPassword(hostile, USER, PASSWORD))).toBe("bad_params");
  });

  it("picks the strongest setting that is fast enough, and the weakest allowed one when none is", async () => {
    // Each call to the fake clock returns the next time, from the strongest setting down.
    const measure = (ms: number[]) => {
      const queue = [...ms];
      return async () => queue.shift() ?? Infinity;
    };
    expect(await pickKdfParams(measure([800]), 1000)).toMatchObject({ m: 65_536, t: 3 });
    expect(await pickKdfParams(measure([2400, 900]), 1000)).toMatchObject({ m: 65_536, t: 2 });
    expect(await pickKdfParams(measure([2400, 1800, 700]), 1000)).toMatchObject({ m: 47_104, t: 1 });
    expect(await pickKdfParams(measure([5000, 4000, 3000]), 1000)).toEqual(WEAKEST_KDF);
  });
});
