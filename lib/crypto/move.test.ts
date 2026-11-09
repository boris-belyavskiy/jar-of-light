import { beforeAll, describe, expect, it } from "vitest";
import { createKeys, decryptField, encryptField } from "@/lib/crypto";
import { WEAKEST_KDF } from "@/lib/crypto/kdf";
import {
  MOVE_KINDS,
  MoveError,
  runMove,
  type Dual,
  type FieldSealed,
  type MoveApi,
  type MoveCrypto,
  type MoveKind,
  type MoveProgress,
  type Unmoved,
} from "@/lib/crypto/move";

const USER = "00000000-0000-4000-8000-00000000000a";
let key: CryptoKey;
const crypto: MoveCrypto = {
  encrypt: (place, text) => encryptField(key, text, { userId: USER, ...place }),
  decrypt: (place, sealed) => decryptField(key, sealed, { userId: USER, ...place }),
};

beforeAll(async () => {
  ({ dataKey: key } = await createKeys({ userId: USER, password: "a long enough password", kdfParams: WEAKEST_KDF }));
}, 30_000);

// --- An in-memory stand-in for the server -----------------------------------

type Cell = { text: string | null; cipher: string | null };
type Row = { id: string; cells: Record<string, Cell> };

function makeStore() {
  const tables: Record<MoveKind, Row[]> = { entries: [], categories: [], category_names: [] };
  const calls = { save: [] as { kind: MoveKind; ids: string[]; chars: number }[] };
  const hooks: { afterSave?: (kind: MoveKind, ids: string[]) => void; dropSaves?: boolean } = {};

  const needs = (r: Row) => Object.values(r.cells).some((c) => c.text !== null && c.cipher === null);
  const both = (r: Row) => Object.values(r.cells).some((c) => c.text !== null && c.cipher !== null);

  const api: MoveApi = {
    async counts() {
      return Object.fromEntries(MOVE_KINDS.map((k) => [k, tables[k].filter(needs).length])) as Record<MoveKind, number>;
    },
    async fetchUnmoved(kind, limit): Promise<Unmoved[]> {
      return tables[kind]
        .filter(needs)
        .slice(0, limit)
        .map((r) => ({
          id: r.id,
          fields: Object.entries(r.cells)
            .filter(([, c]) => c.text !== null && c.cipher === null)
            .map(([field, c]) => ({ field, text: c.text! })),
        }));
    },
    async saveMoved(kind, items: { id: string; fields: FieldSealed[] }[]) {
      calls.save.push({ kind, ids: items.map((i) => i.id), chars: items.reduce((s, i) => s + i.fields.reduce((t, f) => t + f.cipher.length, 0), 0) });
      if (!hooks.dropSaves) {
        for (const item of items) {
          const row = tables[kind].find((r) => r.id === item.id)!;
          for (const f of item.fields) {
            // The guard of the real server: only rows that still have readable text are touched.
            if (row.cells[f.field].text !== null) row.cells[f.field].cipher = f.cipher;
          }
        }
      }
      hooks.afterSave?.(kind, items.map((i) => i.id));
    },
    async fetchDual(kind, afterId, limit): Promise<Dual[]> {
      return tables[kind]
        .filter(both)
        .filter((r) => afterId === null || r.id > afterId)
        .sort((a, b) => (a.id < b.id ? -1 : 1))
        .slice(0, limit)
        .map((r) => ({
          id: r.id,
          fields: Object.entries(r.cells)
            .filter(([, c]) => c.text !== null && c.cipher !== null)
            .map(([field, c]) => ({ field, text: c.text!, cipher: c.cipher! })),
        }));
    },
  };

  const add = (kind: MoveKind, id: string, cells: Record<string, string | null>) =>
    tables[kind].push({ id, cells: Object.fromEntries(Object.entries(cells).map(([f, text]) => [f, { text, cipher: null }])) });
  return { tables, api, add, calls, hooks };
}

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

describe("runMove", () => {
  it("encrypts everything with readable text, keeps the text, and the ciphertext reads back", async () => {
    const s = makeStore();
    s.add("entries", id(1), { body: "Thank you, Anna." });
    s.add("entries", id(2), { body: "Спасибо за вечер ☀️" });
    s.add("categories", id(3), { name_ru: "Прогулки", name_en: null });
    s.add("category_names", id(4), { name_ru: null, name_en: "Relatives" });

    const report = await runMove({ api: s.api, crypto });
    expect(report).toEqual({ encrypted: 4, checked: 4, repaired: 0 });

    const entry = s.tables.entries[1].cells.body;
    expect(entry.text).toBe("Спасибо за вечер ☀️"); // nothing is erased in this step
    expect(await decryptField(key, entry.cipher!, { userId: USER, table: "entries", rowId: id(2), field: "body" })).toBe("Спасибо за вечер ☀️");
    expect(s.tables.categories[0].cells.name_en.cipher).toBeNull(); // an empty name stays empty
    expect(await s.api.counts()).toEqual({ entries: 0, categories: 0, category_names: 0 });
  });

  it("continues where an earlier run stopped, and a second run has nothing to do", async () => {
    const s = makeStore();
    for (let i = 1; i <= 5; i++) s.add("entries", id(i), { body: `note ${i}` });
    // A run that was cut off after two rows.
    for (const row of s.tables.entries.slice(0, 2)) {
      row.cells.body.cipher = await crypto.encrypt({ table: "entries", rowId: row.id, field: "body" }, row.cells.body.text!);
    }
    const first = await runMove({ api: s.api, crypto });
    expect(first.encrypted).toBe(3);
    const second = await runMove({ api: s.api, crypto });
    expect(second).toEqual({ encrypted: 0, checked: 5, repaired: 0 });
  });

  it("notices a text edited after it was encrypted and replaces the ciphertext from the new text", async () => {
    const s = makeStore();
    s.add("entries", id(1), { body: "before" });
    s.add("entries", id(2), { body: "untouched" });
    let edited = false;
    s.hooks.afterSave = () => {
      if (edited) return;
      edited = true;
      s.tables.entries[0].cells.body.text = "edited on another device"; // an old tab saved readable text
    };
    const report = await runMove({ api: s.api, crypto });
    expect(report.repaired).toBe(1);
    const cell = s.tables.entries[0].cells.body;
    expect(await crypto.decrypt({ table: "entries", rowId: id(1), field: "body" }, cell.cipher!)).toBe("edited on another device");
  });

  it("never overwrites the newer ciphertext of a row that was edited on an encrypted device meanwhile", async () => {
    const s = makeStore();
    s.add("entries", id(1), { body: "old readable text" });
    const newer = await crypto.encrypt({ table: "entries", rowId: id(1), field: "body" }, "newer text, written encrypted");
    let swapped = false;
    const realFetch = s.api.fetchUnmoved;
    s.api.fetchUnmoved = async (kind, limit) => {
      const rows = await realFetch(kind, limit);
      if (!swapped && rows.length > 0) {
        swapped = true;
        // After the device read the row, an encrypted edit erased its readable text and set new ciphertext.
        s.tables.entries[0].cells.body = { text: null, cipher: newer };
      }
      return rows;
    };
    await runMove({ api: s.api, crypto });
    expect(s.tables.entries[0].cells.body).toEqual({ text: null, cipher: newer });
  });

  it("replaces a corrupt or misplaced ciphertext found when checking", async () => {
    const s = makeStore();
    s.add("entries", id(1), { body: "one" });
    s.add("entries", id(2), { body: "two" });
    // Row 1 holds row 2's ciphertext: well formed, but bound to another row.
    s.tables.entries[0].cells.body.cipher = await crypto.encrypt({ table: "entries", rowId: id(2), field: "body" }, "two");
    s.tables.entries[1].cells.body.cipher = "v1.AAAA";
    const report = await runMove({ api: s.api, crypto });
    expect(report.repaired).toBe(2);
    for (const row of s.tables.entries) {
      expect(await crypto.decrypt({ table: "entries", rowId: row.id, field: "body" }, row.cells.body.cipher!)).toBe(row.cells.body.text);
    }
  });

  it("stops with an error when saving does not take, instead of looping", async () => {
    const s = makeStore();
    s.add("entries", id(1), { body: "one" });
    s.hooks.dropSaves = true;
    await expect(runMove({ api: s.api, crypto })).rejects.toMatchObject({ code: "stuck" });
  });

  it("gives up with an error when the ciphertext cannot be made to match", async () => {
    const s = makeStore();
    s.add("entries", id(1), { body: "one" });
    // Every save writes ciphertext of the wrong text, so it can never match.
    const realSave = s.api.saveMoved;
    s.api.saveMoved = async (kind, items) => {
      const wrong = await Promise.all(
        items.map(async (i) => ({
          id: i.id,
          fields: await Promise.all(i.fields.map(async (f) => ({ field: f.field, cipher: await crypto.encrypt({ table: kind, rowId: i.id, field: f.field }, "something else") }))),
        })),
      );
      return realSave(kind, wrong);
    };
    await expect(runMove({ api: s.api, crypto })).rejects.toMatchObject({ code: "unverified" });
  });

  it("can be stopped", async () => {
    const s = makeStore();
    for (let i = 1; i <= 3; i++) s.add("entries", id(i), { body: `n${i}` });
    const signal = { aborted: true };
    await expect(runMove({ api: s.api, crypto, signal })).rejects.toBeInstanceOf(MoveError);
  });

  it("saves in several smaller requests when the ciphertext is large", async () => {
    const s = makeStore();
    for (let i = 1; i <= 40; i++) s.add("entries", id(i), { body: "x".repeat(16_000) }); // about 21,000 characters of ciphertext each
    await runMove({ api: s.api, crypto });
    const entrySaves = s.calls.save.filter((c) => c.kind === "entries");
    expect(entrySaves.length).toBeGreaterThan(1);
    for (const call of entrySaves) expect(call.chars).toBeLessThan(310_000);
    expect(entrySaves.flatMap((c) => c.ids)).toHaveLength(40);
  });

  it("reports progress from encrypting through checking to done", async () => {
    const s = makeStore();
    for (let i = 1; i <= 3; i++) s.add("entries", id(i), { body: `n${i}` });
    const seen: MoveProgress[] = [];
    await runMove({ api: s.api, crypto, onProgress: (p) => seen.push(p) });
    expect(seen[0]).toMatchObject({ phase: "encrypting", encrypted: 0, total: 3 });
    expect(seen.map((p) => p.phase)).toEqual([...new Set(seen.map((p) => p.phase))].flatMap((ph) => seen.filter((p) => p.phase === ph).map(() => ph)));
    expect(seen.at(-1)).toMatchObject({ phase: "done", encrypted: 3, total: 3, checked: 3 });
  });
});
