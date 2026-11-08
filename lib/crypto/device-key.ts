/**
 * Where the data key lives on this device (ADR-0011): in IndexedDB, as a
 * non-extractable CryptoKey, so scripts can use it but not read its bytes.
 * One entry per user. Sign-out and account deletion wipe it. Every function
 * swallows storage errors (private windows, blocked site data) and says so
 * through its result: the key then lives only in memory and the password is
 * asked again next time.
 */
const DB_NAME = "jar-of-light-keys";
const STORE = "data-keys";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("blocked"));
  });
}

async function run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T> | null): Promise<T | undefined> {
  const db = await openDb();
  try {
    return await new Promise<T | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const request = work(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(request?.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

/** True when the key was stored. */
export async function saveDeviceKey(userId: string, key: CryptoKey): Promise<boolean> {
  try {
    await run("readwrite", (store) => store.put(key, userId));
    return true;
  } catch {
    return false;
  }
}

export async function loadDeviceKey(userId: string): Promise<CryptoKey | null> {
  try {
    const key = await run<CryptoKey | undefined>("readonly", (store) => store.get(userId));
    return key ?? null;
  } catch {
    return null;
  }
}

/** Removes the key of one user, or with `exceptUserId` the keys of everyone else. Without arguments, all. */
export async function clearDeviceKeys(options: { userId?: string; exceptUserId?: string } = {}): Promise<void> {
  try {
    await run("readwrite", (store) => {
      if (options.userId) return store.delete(options.userId);
      if (options.exceptUserId) {
        const cursorRequest = store.openKeyCursor();
        cursorRequest.onsuccess = () => {
          const cursor = cursorRequest.result;
          if (!cursor) return;
          if (cursor.key !== options.exceptUserId) store.delete(cursor.key);
          cursor.continue();
        };
        return null;
      }
      return store.clear();
    });
  } catch {
    // Nothing stored, or storage is unavailable: either way there is no key left to wipe.
  }
}
