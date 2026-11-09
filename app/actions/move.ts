"use server";

import { z } from "zod";
import type { Dual, MoveKind, Unmoved } from "@/lib/crypto/move";
import { getKeyRecord, requireUserId } from "@/lib/db/queries";
import { countUnmoved, listDual, listUnmoved, saveCiphertext } from "@/lib/db/move";

// The device moves an account to ciphertext through these actions (Horizon 1,
// step 3). They hand out readable rows, which are the user's own and already
// on the server, and store ciphertext made on the device. Only an account that
// has keys can use them. Errors carry only codes.

const kind = z.enum(["entries", "categories", "category_names"]);
const cipher = z.string().min(16).max(24_000).regex(/^v1\.[A-Za-z0-9_-]+$/);
const items = z
  .array(
    z.object({
      id: z.uuid(),
      fields: z.array(z.object({ field: z.enum(["body", "name_ru", "name_en"]), cipher })).min(1).max(2),
    }),
  )
  .max(500);

async function requireKeyedAccount() {
  await requireUserId();
  if ((await getKeyRecord()) === null) throw new Error("move: encryption is not on");
}

export async function moveCounts(): Promise<Record<MoveKind, number>> {
  await requireKeyedAccount();
  return countUnmoved();
}

export async function moveFetchUnmoved(k: MoveKind, limit: number): Promise<Unmoved[]> {
  await requireKeyedAccount();
  return listUnmoved(kind.parse(k), Math.min(Math.max(1, Math.floor(limit)), 200));
}

export async function moveSave(k: MoveKind, rows: { id: string; fields: { field: string; cipher: string }[] }[]): Promise<void> {
  await requireKeyedAccount();
  await saveCiphertext(kind.parse(k), items.parse(rows));
}

export async function moveFetchDual(k: MoveKind, afterId: string | null, limit: number): Promise<Dual[]> {
  await requireKeyedAccount();
  return listDual(kind.parse(k), afterId === null ? null : z.uuid().parse(afterId), Math.min(Math.max(1, Math.floor(limit)), 200));
}
