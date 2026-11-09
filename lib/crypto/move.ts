/**
 * Moving an existing account to ciphertext (ADR-0011, Tech Spec 5.6, Roadmap
 * Horizon 1 step 3). Everything the person wrote before encryption is readable
 * text in the database; this encrypts it on the device and saves the
 * ciphertext NEXT TO the readable text. Nothing is erased here: that is step 4,
 * after this has checked everything.
 *
 * The run keeps no state of its own. "What is left" is whatever still has
 * readable text and no ciphertext, asked of the server each time, so a closed
 * tab or a lost connection costs nothing: the next run continues. Saving is
 * safe to repeat. The engine takes the server and the crypto as arguments, so
 * it can be tested with an in-memory store.
 */

export type MoveKind = "entries" | "categories" | "category_names";
/** Small tables first, so a long run over entries starts with the names already done. */
export const MOVE_KINDS: MoveKind[] = ["category_names", "categories", "entries"];

export type FieldText = { field: string; text: string };
export type FieldSealed = { field: string; cipher: string };
export type Unmoved = { id: string; fields: FieldText[] };
export type Dual = { id: string; fields: (FieldText & { cipher: string })[] };

export type MoveApi = {
  /** Rows per kind that have readable text and no ciphertext yet. */
  counts(): Promise<Record<MoveKind, number>>;
  /** The next rows that still need ciphertext: readable text only. */
  fetchUnmoved(kind: MoveKind, limit: number): Promise<Unmoved[]>;
  /**
   * Saves ciphertext next to the readable text. It must apply only to rows
   * that still have readable text, so it can never overwrite the newer
   * ciphertext of a row another device has already edited.
   */
  saveMoved(kind: MoveKind, items: { id: string; fields: FieldSealed[] }[]): Promise<void>;
  /** Rows that have both readable text and ciphertext, after `afterId` in id order. */
  fetchDual(kind: MoveKind, afterId: string | null, limit: number): Promise<Dual[]>;
};

export type MovePlace = { table: MoveKind; rowId: string; field: string };
export type MoveCrypto = {
  encrypt(place: MovePlace, text: string): Promise<string>;
  decrypt(place: MovePlace, sealed: string): Promise<string>;
};

export type MoveProgress = {
  phase: "encrypting" | "checking" | "done";
  /** Rows encrypted so far, and how many there were when the run began. */
  encrypted: number;
  total: number;
  /** Rows checked in the current round of checking. */
  checked: number;
};

export type MoveReport = {
  encrypted: number;
  checked: number;
  /** Ciphertexts that did not match the readable text and were replaced from it. */
  repaired: number;
};

export class MoveError extends Error {
  constructor(readonly code: "stuck" | "unverified" | "aborted") {
    super(code);
    this.name = "MoveError";
  }
}

const BATCH_ROWS = 100;
/** Kept well under the server action body limit (about 1 MB). */
const MAX_BATCH_BYTES = 300_000;
const MAX_CHECK_ROUNDS = 3;

function chunkBySize<T extends { fields: FieldSealed[] }>(items: T[]): T[][] {
  const chunks: T[][] = [];
  let current: T[] = [];
  let bytes = 0;
  for (const item of items) {
    const size = item.fields.reduce((sum, f) => sum + f.cipher.length, 0) + 64;
    if (current.length > 0 && bytes + size > MAX_BATCH_BYTES) {
      chunks.push(current);
      current = [];
      bytes = 0;
    }
    current.push(item);
    bytes += size;
  }
  if (current.length > 0) chunks.push(current);
  return chunks;
}

export async function runMove(args: {
  api: MoveApi;
  crypto: MoveCrypto;
  onProgress?: (progress: MoveProgress) => void;
  signal?: { aborted: boolean };
}): Promise<MoveReport> {
  const { api, crypto, signal } = args;
  const stop = () => {
    if (signal?.aborted) throw new MoveError("aborted");
  };
  const counts = await api.counts();
  const total = MOVE_KINDS.reduce((sum, k) => sum + counts[k], 0);
  const progress: MoveProgress = { phase: "encrypting", encrypted: 0, total, checked: 0 };
  const report = (patch: Partial<MoveProgress> = {}) => args.onProgress?.({ ...progress, ...patch });
  report();

  // --- Encrypt what has no ciphertext yet ----------------------------------
  for (const kind of MOVE_KINDS) {
    let previous = "";
    for (;;) {
      stop();
      const rows = await api.fetchUnmoved(kind, BATCH_ROWS);
      if (rows.length === 0) break;
      // The same rows coming back means saving did not take: stop instead of looping forever.
      const signature = rows.map((r) => r.id).join(",");
      if (signature === previous) throw new MoveError("stuck");
      previous = signature;

      const sealed = [];
      for (const row of rows) {
        const fields: FieldSealed[] = [];
        for (const f of row.fields) {
          fields.push({ field: f.field, cipher: await crypto.encrypt({ table: kind, rowId: row.id, field: f.field }, f.text) });
        }
        sealed.push({ id: row.id, fields });
      }
      for (const chunk of chunkBySize(sealed)) {
        stop();
        await api.saveMoved(kind, chunk);
      }
      progress.encrypted += rows.length;
      report();
    }
  }

  // --- Download it all again, decrypt, compare with the readable text -------
  let repaired = 0;
  let checkedTotal = 0;
  for (let round = 1; ; round++) {
    progress.phase = "checking";
    progress.checked = 0;
    report();
    const wrong: { kind: MoveKind; id: string; fields: FieldText[] }[] = [];

    for (const kind of MOVE_KINDS) {
      let after: string | null = null;
      for (;;) {
        stop();
        const rows = await api.fetchDual(kind, after, BATCH_ROWS);
        if (rows.length === 0) break;
        for (const row of rows) {
          const bad: FieldText[] = [];
          for (const f of row.fields) {
            let opened: string | null;
            try {
              opened = await crypto.decrypt({ table: kind, rowId: row.id, field: f.field }, f.cipher);
            } catch {
              opened = null; // changed, from another key, or from another row
            }
            if (opened !== f.text) bad.push({ field: f.field, text: f.text });
          }
          if (bad.length > 0) wrong.push({ kind, id: row.id, fields: bad });
        }
        progress.checked += rows.length;
        report();
        after = rows[rows.length - 1].id;
        if (rows.length < BATCH_ROWS) break;
      }
    }
    checkedTotal = progress.checked;
    if (wrong.length === 0) break;
    if (round >= MAX_CHECK_ROUNDS) throw new MoveError("unverified");

    // The readable text is the truth until step 4: replace the ciphertext from it, then check again.
    for (const kind of MOVE_KINDS) {
      const items = [];
      for (const w of wrong.filter((x) => x.kind === kind)) {
        const fields: FieldSealed[] = [];
        for (const f of w.fields) {
          fields.push({ field: f.field, cipher: await crypto.encrypt({ table: kind, rowId: w.id, field: f.field }, f.text) });
        }
        items.push({ id: w.id, fields });
      }
      for (const chunk of chunkBySize(items)) await api.saveMoved(kind, chunk);
    }
    repaired += wrong.length;
  }

  progress.phase = "done";
  report();
  return { encrypted: progress.encrypted, checked: checkedTotal, repaired };
}
