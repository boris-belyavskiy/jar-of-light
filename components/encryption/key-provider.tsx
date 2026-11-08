"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  calibrateKdf,
  changePassword as changePasswordCrypto,
  createKeys,
  CryptoError,
  decryptField as decryptFieldCrypto,
  encryptField as encryptFieldCrypto,
  type FieldContext,
  replaceRecoveryCode,
  resetPasswordWithCode,
  unlockWithPassword as unlockWithPasswordCrypto,
  type KeyRecord,
} from "@/lib/crypto";
import { clearDeviceKeys, loadDeviceKey, saveDeviceKey } from "@/lib/crypto/device-key";

/**
 * The encryption state of the signed-in user on this device (ADR-0011):
 * `off` (no keys yet), `locked` (keys exist, this device has no key), `unlocked`.
 * The data key itself stays inside this provider and IndexedDB; components get
 * functions that use it, never its bytes. Nothing here logs a password, a code
 * or a key.
 */
export type KeyStatus = "loading" | "off" | "locked" | "unlocked";

export type SaveResult = { ok: true } | { error: "exists" | "invalid" | "save" };
/** Stores wrapped keys on the server. The real ones are server actions; previews pass fakes. */
export type PersistKeys = {
  create(record: KeyRecord): Promise<SaveResult>;
  update(record: KeyRecord): Promise<SaveResult>;
};

/** The server refused to store the keys. */
export class KeyStoreError extends Error {
  constructor(readonly code: "exists" | "invalid" | "save") {
    super(code);
    this.name = "KeyStoreError";
  }
}

/** Keys made on this device but not stored yet: the user must first type the recovery code back. */
export type PreparedSetup = Awaited<ReturnType<typeof createKeys>>;
export type PreparedRecoveryCode = Awaited<ReturnType<typeof replaceRecoveryCode>>;

/** Where an encrypted value lives, without the user: the provider adds that. */
export type FieldPlace = Omit<FieldContext, "userId">;

type KeysContext = {
  status: KeyStatus;
  /** True for an account with no keys and no entries: it sets up encryption before writing its first entry. */
  needsSetup: boolean;
  /** Encrypts a value for this user, or throws when the device has no key. */
  encrypt(place: FieldPlace, text: string): Promise<string>;
  /** Decrypts a value of this user, or throws when the device has no key or the value was changed. */
  decrypt(place: FieldPlace, sealed: string): Promise<string>;
  /** For later steps: the key that encrypts and decrypts content. Null unless unlocked. */
  dataKey: CryptoKey | null;
  /** Whether this device keeps the key between visits (and through sign-out), or only while the tab is open. */
  remembered: boolean;
  prepareSetup(password: string): Promise<PreparedSetup>;
  confirmSetup(prepared: PreparedSetup, remember: boolean): Promise<void>;
  unlock(password: string, remember: boolean): Promise<void>;
  resetPassword(code: string, newPassword: string, remember: boolean): Promise<void>;
  changePassword(current: string, next: string): Promise<void>;
  prepareNewRecoveryCode(password: string): Promise<PreparedRecoveryCode>;
  confirmNewRecoveryCode(prepared: PreparedRecoveryCode): Promise<void>;
  /** Forget the key on this device only; the keys stay on the server. */
  lock(): Promise<void>;
  /** Forget every key on this device: before deleting the account. */
  wipeDevice(): Promise<void>;
};

const Context = createContext<KeysContext | null>(null);

export function useKeys(): KeysContext {
  const context = useContext(Context);
  if (!context) throw new Error("useKeys needs a KeyProvider");
  return context;
}

async function store(action: Promise<SaveResult>) {
  const result = await action;
  if ("error" in result) throw new KeyStoreError(result.error);
}

export function KeyProvider({
  userId,
  record: initialRecord,
  persist,
  newAccount = false,
  children,
}: {
  userId: string;
  record: KeyRecord | null;
  persist: PersistKeys;
  /** The account has no entries yet; with no keys it must set up encryption first. */
  newAccount?: boolean;
  children: ReactNode;
}) {
  const [record, setRecord] = useState(initialRecord);
  const [dataKey, setDataKey] = useState<CryptoKey | null>(null);
  const [remembered, setRemembered] = useState(false);
  const [status, setStatus] = useState<KeyStatus>(initialRecord ? "loading" : "off");

  // On arrival: forget other users' keys, then pick up this user's key if the device has it.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await clearDeviceKeys({ exceptUserId: userId });
      if (!initialRecord) {
        await clearDeviceKeys({ userId }); // a key without keys on the server is a leftover
        return;
      }
      const key = await loadDeviceKey(userId);
      if (cancelled) return;
      setDataKey(key);
      setRemembered(key !== null); // found in storage, so this device remembers it
      setStatus(key ? "unlocked" : "locked");
    })();
    return () => {
      cancelled = true;
    };
    // Only on arrival: later changes go through the functions below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const adopt = useCallback(
    async (key: CryptoKey, next: KeyRecord, remember: boolean) => {
      // If storage is blocked the key stays in memory for this visit, as when the box is unchecked.
      const stored = remember ? await saveDeviceKey(userId, key) : false;
      if (!remember) await clearDeviceKeys({ userId });
      setRemembered(stored);
      setRecord(next);
      setDataKey(key);
      setStatus("unlocked");
    },
    [userId],
  );

  const value = useMemo<KeysContext>(
    () => ({
      status,
      needsSetup: newAccount && record === null,
      dataKey,
      remembered,

      async encrypt(place, text) {
        if (!dataKey) throw new CryptoError("decrypt_failed");
        return encryptFieldCrypto(dataKey, text, { userId, ...place });
      },

      async decrypt(place, sealed) {
        if (!dataKey) throw new CryptoError("decrypt_failed");
        return decryptFieldCrypto(dataKey, sealed, { userId, ...place });
      },

      async prepareSetup(password) {
        const kdfParams = await calibrateKdf();
        return createKeys({ userId, password, kdfParams });
      },

      async confirmSetup(prepared, remember) {
        await store(persist.create(prepared.record));
        await adopt(prepared.dataKey, prepared.record, remember);
      },

      async unlock(password, remember) {
        if (!record) throw new CryptoError("bad_format");
        const key = await unlockWithPasswordCrypto(record, userId, password);
        await adopt(key, record, remember);
      },

      async resetPassword(code, newPassword, remember) {
        if (!record) throw new CryptoError("bad_format");
        const next = await resetPasswordWithCode({ record, userId, code, newPassword });
        await store(persist.update(next));
        // The new password opens the same data key; unlock with it to get a key for this device.
        const key = await unlockWithPasswordCrypto(next, userId, newPassword);
        await adopt(key, next, remember);
      },

      async changePassword(current, next) {
        if (!record) throw new CryptoError("bad_format");
        const updated = await changePasswordCrypto({
          record,
          userId,
          currentPassword: current,
          newPassword: next,
          kdfParams: await calibrateKdf(),
        });
        await store(persist.update(updated));
        setRecord(updated);
      },

      async prepareNewRecoveryCode(password) {
        if (!record) throw new CryptoError("bad_format");
        return replaceRecoveryCode({ record, userId, password });
      },

      async confirmNewRecoveryCode(prepared) {
        await store(persist.update(prepared.record));
        setRecord(prepared.record);
      },

      async lock() {
        await clearDeviceKeys({ userId });
        setDataKey(null);
        setRemembered(false);
        setStatus(record ? "locked" : "off");
      },

      async wipeDevice() {
        await clearDeviceKeys();
        setDataKey(null);
        setRemembered(false);
      },
    }),
    [status, newAccount, dataKey, remembered, record, userId, persist, adopt],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}
