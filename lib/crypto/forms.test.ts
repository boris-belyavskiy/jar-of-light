import { beforeAll, describe, expect, it } from "vitest";
import { createKeys, decryptField, encryptField, type FieldContext } from "@/lib/crypto";
import { sealCategoryNames, sealEntryBody, writeMode } from "@/lib/crypto/forms";
import { WEAKEST_KDF } from "@/lib/crypto/kdf";

const USER = "00000000-0000-4000-8000-00000000000a";
const ROW = "11111111-1111-4111-8111-111111111111";

let key: CryptoKey;
const encrypt = (place: Omit<FieldContext, "userId">, text: string) => encryptField(key, text, { userId: USER, ...place });
const decrypt = (place: Omit<FieldContext, "userId">, sealed: string) => decryptField(key, sealed, { userId: USER, ...place });

beforeAll(async () => {
  ({ dataKey: key } = await createKeys({ userId: USER, password: "a long enough password", kdfParams: WEAKEST_KDF }));
}, 30_000);

describe("writeMode", () => {
  it("saves readable text for an account without keys, and encrypts when the device has the key", () => {
    expect(writeMode("off", false)).toBe("plain");
    expect(writeMode("unlocked", false)).toBe("encrypted");
  });

  it("asks for the password on a locked device, and for setup on a new account", () => {
    expect(writeMode("locked", false)).toBe("locked");
    expect(writeMode("off", true)).toBe("setup");
  });

  it("waits while the device's storage is still being read", () => {
    expect(writeMode("loading", false)).toBe("wait");
    expect(writeMode("loading", true)).toBe("wait");
  });

  it("an account with keys never falls back to readable text, new or not", () => {
    expect(writeMode("locked", true)).toBe("locked");
    expect(writeMode("unlocked", true)).toBe("encrypted");
  });
});

describe("sealEntryBody", () => {
  it("trims, encrypts for that row and field, and the text comes back", async () => {
    const result = await sealEntryBody(encrypt, ROW, "  Thank you, Anna.  ");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.cipher).not.toContain("Anna");
    expect(await decrypt({ table: "entries", rowId: ROW, field: "body" }, result.cipher)).toBe("Thank you, Anna.");
    // Bound to its row: the same ciphertext does not open for another entry.
    await expect(decrypt({ table: "entries", rowId: "22222222-2222-4222-8222-222222222222", field: "body" }, result.cipher)).rejects.toThrow();
  });

  it("applies the length rules on the device, because the server cannot see the text", async () => {
    expect(await sealEntryBody(encrypt, ROW, "   ")).toEqual({ ok: false, error: "entry.errors.empty" });
    expect(await sealEntryBody(encrypt, ROW, "a".repeat(4001))).toEqual({ ok: false, error: "entry.errors.tooLong" });
    expect((await sealEntryBody(encrypt, ROW, "😀".repeat(4000))).ok).toBe(true);
  });
});

describe("sealCategoryNames", () => {
  const own = { table: "categories" as const, categoryId: ROW };

  it("encrypts each name for its own field and leaves an empty one empty", async () => {
    const result = await sealCategoryNames(encrypt, { ...own, names: { ru: "Прогулки", en: "" } });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.en).toBeNull();
    expect(await decrypt({ table: "categories", rowId: ROW, field: "name_ru" }, result.ru!)).toBe("Прогулки");
  });

  it("an own category needs a name, a built-in one may be reset with none", async () => {
    expect(await sealCategoryNames(encrypt, { ...own, names: { ru: "", en: " " } })).toEqual({
      ok: false,
      error: "categories.errors.empty",
    });
    expect(await sealCategoryNames(encrypt, { table: "category_names", categoryId: ROW, names: { ru: "", en: "" } })).toEqual({
      ok: true,
      ru: null,
      en: null,
    });
  });

  it("refuses names over 40 characters", async () => {
    expect(await sealCategoryNames(encrypt, { ...own, names: { ru: "", en: "x".repeat(41) } })).toEqual({
      ok: false,
      error: "categories.errors.tooLong",
    });
  });

  it("refuses a name another own category already has in that language, ignoring case and spaces", async () => {
    const others = [{ ru: null, en: "Walks" }];
    expect(await sealCategoryNames(encrypt, { ...own, names: { ru: "", en: " walks " }, others })).toEqual({
      ok: false,
      error: "categories.errors.duplicate",
    });
    // The same word in the other language is fine, as in the database.
    expect((await sealCategoryNames(encrypt, { ...own, names: { ru: "walks", en: "" }, others })).ok).toBe(true);
  });

  it("does not apply the duplicate rule to renames of built-in categories", async () => {
    const others = [{ ru: null, en: "Walks" }];
    expect((await sealCategoryNames(encrypt, { table: "category_names", categoryId: ROW, names: { ru: "", en: "Walks" }, others })).ok).toBe(true);
  });
});
