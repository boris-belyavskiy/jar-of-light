import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { clearDeviceKeys, loadDeviceKey, saveDeviceKey } from "@/lib/crypto/device-key";
import { createKeys, decryptField, encryptField } from "@/lib/crypto";
import { WEAKEST_KDF as WEAKEST } from "@/lib/crypto/kdf";

const A = "00000000-0000-4000-8000-00000000000a";
const B = "00000000-0000-4000-8000-00000000000b";
const ctx = { userId: A, table: "entries" as const, rowId: "r1", field: "body" };

let keyA: CryptoKey;
let keyB: CryptoKey;

beforeEach(async () => {
  await clearDeviceKeys();
  keyA ??= (await createKeys({ userId: A, password: "password for a", kdfParams: WEAKEST })).dataKey;
  keyB ??= (await createKeys({ userId: B, password: "password for b", kdfParams: WEAKEST })).dataKey;
});

describe("the key on this device", () => {
  it("is empty until a key is saved", async () => {
    expect(await loadDeviceKey(A)).toBeNull();
  });

  it("comes back usable after it was saved, and still cannot be exported", async () => {
    expect(await saveDeviceKey(A, keyA)).toBe(true);
    const loaded = await loadDeviceKey(A);
    expect(loaded).not.toBeNull();
    const sealed = await encryptField(keyA, "written before the reload", ctx);
    expect(await decryptField(loaded!, sealed, ctx)).toBe("written before the reload");
    await expect(crypto.subtle.exportKey("raw", loaded!)).rejects.toThrow();
  });

  it("keeps one key per user", async () => {
    await saveDeviceKey(A, keyA);
    await saveDeviceKey(B, keyB);
    const sealed = await encryptField(keyB, "b", { ...ctx, userId: B });
    expect(await decryptField((await loadDeviceKey(B))!, sealed, { ...ctx, userId: B })).toBe("b");
    expect(await loadDeviceKey(A)).not.toBeNull();
  });

  it("is wiped for one user, for everyone but one, or for all", async () => {
    await saveDeviceKey(A, keyA);
    await saveDeviceKey(B, keyB);
    await clearDeviceKeys({ userId: A });
    expect(await loadDeviceKey(A)).toBeNull();
    expect(await loadDeviceKey(B)).not.toBeNull();

    await saveDeviceKey(A, keyA);
    await clearDeviceKeys({ exceptUserId: A });
    expect(await loadDeviceKey(A)).not.toBeNull();
    expect(await loadDeviceKey(B)).toBeNull();

    await clearDeviceKeys();
    expect(await loadDeviceKey(A)).toBeNull();
  });

  it("reports failure instead of throwing when storage is unavailable", async () => {
    const original = globalThis.indexedDB;
    // @ts-expect-error simulating a browser that blocks site data
    globalThis.indexedDB = undefined;
    try {
      expect(await saveDeviceKey(A, keyA)).toBe(false);
      expect(await loadDeviceKey(A)).toBeNull();
      await expect(clearDeviceKeys()).resolves.toBeUndefined();
    } finally {
      globalThis.indexedDB = original;
    }
  });
});
