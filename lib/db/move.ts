import "server-only";
import { cache } from "react";
import { requireUserId } from "@/lib/db/queries";
import type { Dual, FieldSealed, MoveKind, Unmoved } from "@/lib/crypto/move";
import { createClient } from "@/lib/supabase/server";

/**
 * What the move to ciphertext reads and writes on the server (Horizon 1 step 3).
 * Each kind is one table, its key column, and the pairs of a readable column
 * and the column that will hold its ciphertext. The server never sees a key:
 * it hands out rows and stores ciphertext the device made.
 */
type Config = { table: string; key: string; pairs: [plain: string, cipher: string][]; ownOnly?: boolean };

const NAME_PAIRS: [string, string][] = [
  ["name_ru", "name_ru_enc"],
  ["name_en", "name_en_enc"],
];

const CONFIG: Record<MoveKind, Config> = {
  entries: { table: "entries", key: "id", pairs: [["body", "body_enc"]] },
  // Built-in categories carry no names; only the user's own rows are moved.
  categories: { table: "categories", key: "id", pairs: NAME_PAIRS, ownOnly: true },
  category_names: { table: "category_names", key: "category_id", pairs: NAME_PAIRS },
};

const unmovedFilter = (c: Config) => c.pairs.map(([p, e]) => `and(${p}.not.is.null,${e}.is.null)`).join(",");
const dualFilter = (c: Config) => c.pairs.map(([p, e]) => `and(${p}.not.is.null,${e}.not.is.null)`).join(",");

/** How many rows of each kind still have readable text and no ciphertext. */
export const countUnmoved = cache(async (): Promise<Record<MoveKind, number>> => {
  await requireUserId();
  const supabase = await createClient();
  const counts = {} as Record<MoveKind, number>;
  await Promise.all(
    (Object.keys(CONFIG) as MoveKind[]).map(async (kind) => {
      const c = CONFIG[kind];
      let query = supabase.from(c.table).select(c.key, { count: "exact", head: true }).or(unmovedFilter(c));
      if (c.ownOnly) query = query.not("user_id", "is", null);
      const { count, error } = await query;
      if (error) throw new Error(`move count ${kind}: ${error.code}`);
      counts[kind] = count ?? 0;
    }),
  );
  return counts;
});

type Row = Record<string, string | null>;

/** The next rows that still need ciphertext, with only the fields that need it. */
export async function listUnmoved(kind: MoveKind, limit: number): Promise<Unmoved[]> {
  await requireUserId();
  const c = CONFIG[kind];
  const supabase = await createClient();
  let query = supabase
    .from(c.table)
    .select([c.key, ...c.pairs.flat()].join(", "))
    .or(unmovedFilter(c))
    .order(c.key, { ascending: true })
    .limit(limit);
  if (c.ownOnly) query = query.not("user_id", "is", null);
  const { data, error } = await query;
  if (error) throw new Error(`move list ${kind}: ${error.code}`);
  return (data as unknown as Row[]).map((row) => ({
    id: row[c.key] as string,
    fields: c.pairs.flatMap(([p, e]) => (row[p] !== null && row[e] === null ? [{ field: p, text: row[p] as string }] : [])),
  }));
}

/** Rows that have both readable text and ciphertext, in key order after `afterId`, for checking. */
export async function listDual(kind: MoveKind, afterId: string | null, limit: number): Promise<Dual[]> {
  await requireUserId();
  const c = CONFIG[kind];
  const supabase = await createClient();
  let query = supabase
    .from(c.table)
    .select([c.key, ...c.pairs.flat()].join(", "))
    .or(dualFilter(c))
    .order(c.key, { ascending: true })
    .limit(limit);
  if (c.ownOnly) query = query.not("user_id", "is", null);
  if (afterId) query = query.gt(c.key, afterId);
  const { data, error } = await query;
  if (error) throw new Error(`move dual ${kind}: ${error.code}`);
  return (data as unknown as Row[]).map((row) => ({
    id: row[c.key] as string,
    fields: c.pairs.flatMap(([p, e]) =>
      row[p] !== null && row[e] !== null ? [{ field: p, text: row[p] as string, cipher: row[e] as string }] : [],
    ),
  }));
}

/**
 * Stores ciphertext next to the readable text. Each update applies only to a
 * row whose readable column is still filled: a row that was edited meanwhile on
 * an encrypted device has none, and its newer ciphertext must not be replaced.
 */
export async function saveCiphertext(kind: MoveKind, items: { id: string; fields: FieldSealed[] }[]): Promise<void> {
  await requireUserId();
  const c = CONFIG[kind];
  const supabase = await createClient();
  const jobs = items.flatMap((item) =>
    item.fields.map((f) => {
      const pair = c.pairs.find(([p]) => p === f.field);
      if (!pair) throw new Error(`move save ${kind}: unknown field`);
      return { id: item.id, plain: pair[0], cipherColumn: pair[1], cipher: f.cipher };
    }),
  );
  // A few at a time: the requests are small and the database is far away.
  for (let i = 0; i < jobs.length; i += 10) {
    const results = await Promise.all(
      jobs.slice(i, i + 10).map((j) =>
        supabase.from(c.table).update({ [j.cipherColumn]: j.cipher }).eq(c.key, j.id).not(j.plain, "is", null),
      ),
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) throw new Error(`move save ${kind}: ${failed.error.code}`);
  }
}
