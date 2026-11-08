"use server";

import { z } from "zod";
import type { KeyRecord } from "@/lib/crypto";
import { assertAcceptableKdf } from "@/lib/crypto/kdf";
import { requireUserId } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";

// These actions store keys that are already wrapped on the device. No password,
// recovery code or data key ever reaches them, and errors carry only codes.

const base64Url = /^[A-Za-z0-9_-]+$/;
const sealed = z.string().min(16).max(512).regex(/^v1\.[A-Za-z0-9_-]+$/);

const recordSchema = z.object({
  keyVersion: z.number().int().min(1).max(32_767),
  kdfSalt: z.string().min(16).max(128).regex(base64Url),
  kdfParams: z.unknown().refine((p) => {
    try {
      assertAcceptableKdf(p);
      return true;
    } catch {
      return false;
    }
  }),
  wrappedKeyPassword: sealed,
  wrappedKeyRecovery: sealed,
});

export type KeyActionResult = { ok: true } | { error: "exists" | "invalid" | "save" };

function toRow(record: KeyRecord) {
  return {
    key_version: record.keyVersion,
    kdf_salt: record.kdfSalt,
    kdf_params: record.kdfParams,
    wrapped_key_password: record.wrappedKeyPassword,
    wrapped_key_recovery: record.wrappedKeyRecovery,
  };
}

/** First setup. A second device that races to set up fails with "exists" and should unlock instead. */
export async function saveKeyRecord(record: KeyRecord): Promise<KeyActionResult> {
  const userId = await requireUserId();
  if (!recordSchema.safeParse(record).success) return { error: "invalid" };
  const supabase = await createClient();
  const { error } = await supabase.from("user_keys").insert({ user_id: userId, ...toRow(record) });
  if (error) return { error: error.code === "23505" ? "exists" : "save" };
  return { ok: true };
}

/** Change of password, or a new recovery code: the data key is the same, only a wrap changes. */
export async function updateKeyRecord(record: KeyRecord): Promise<KeyActionResult> {
  const userId = await requireUserId();
  if (!recordSchema.safeParse(record).success) return { error: "invalid" };
  const supabase = await createClient();
  const { data, error } = await supabase.from("user_keys").update(toRow(record)).eq("user_id", userId).select("user_id");
  if (error || data.length === 0) return { error: "save" };
  return { ok: true };
}
