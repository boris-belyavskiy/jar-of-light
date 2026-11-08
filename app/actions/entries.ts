"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getKeyRecord, requireUserId } from "@/lib/db/queries";
import { safeFeedPath } from "@/lib/feed-filter";
import { createClient } from "@/lib/supabase/server";
import { encryptedEntrySchema, entrySchema } from "@/lib/validation";
import type { FormState } from "./state";

// Never log entry text: errors carry only codes.
//
// An account with encryption keys saves ciphertext made on the device and the
// server refuses plaintext from it (ADR-0011): an old tab, a script or a bug
// must not put readable text next to keys that promise otherwise. An account
// without keys saves plaintext as before, until it opts in.

type Saved =
  | { kind: "plain"; body: string; occurredOn: string; occurredTime: string; categoryIds: string[] }
  | { kind: "encrypted"; id: string; bodyCipher: string; occurredOn: string; occurredTime: string; categoryIds: string[] };

async function validate(formData: FormData): Promise<{ data: Saved } | { error: string }> {
  const encrypted = (await getKeyRecord()) !== null;
  const meta = {
    occurredOn: formData.get("occurredOn") ?? "",
    occurredTime: formData.get("occurredTime") ?? "",
    categoryIds: formData.getAll("categoryIds"),
  };

  if (encrypted) {
    if (formData.has("body")) return { error: "encryption.errors.plaintext" };
    const parsed = encryptedEntrySchema.safeParse({
      ...meta,
      entryId: formData.get("entryId"),
      bodyCipher: formData.get("bodyCipher"),
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "entry.errors.save" };
    const { entryId, ...rest } = parsed.data;
    return { data: { kind: "encrypted", id: entryId, ...rest } };
  }

  // No keys here, so ciphertext is not expected: it would mean a client that thinks the account is encrypted.
  if (formData.has("bodyCipher")) return { error: "encryption.errors.generic" };
  const parsed = entrySchema.safeParse({ ...meta, body: formData.get("body") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "entry.errors.save" };
  return { data: { kind: "plain", ...parsed.data } };
}

export async function createEntry(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const result = await validate(formData);
  if ("error" in result) return { error: result.error };
  const saved = result.data;

  const supabase = await createClient();
  const when = { occurred_on: saved.occurredOn, occurred_time: saved.occurredTime };
  const { data, error } =
    saved.kind === "encrypted"
      ? await supabase.from("entries").insert({ id: saved.id, user_id: userId, body_enc: saved.bodyCipher, ...when }).select("id").single()
      : await supabase.from("entries").insert({ user_id: userId, body: saved.body, ...when }).select("id").single();
  if (error) return { error: "entry.errors.save" };

  if (saved.categoryIds.length > 0) {
    const links = saved.categoryIds.map((category_id) => ({ entry_id: data.id, category_id }));
    const { error: linkError } = await supabase.from("entry_categories").insert(links);
    if (linkError) return { error: "entry.errors.categories" };
  }
  revalidatePath("/app");
  redirect(safeFeedPath(formData.get("returnTo")));
}

export async function updateEntry(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireUserId();
  const result = await validate(formData);
  if ("error" in result) return { error: result.error };
  const saved = result.data;
  // The ciphertext is bound to the row it was made for.
  if (saved.kind === "encrypted" && saved.id !== id) return { error: "encryption.errors.generic" };

  const supabase = await createClient();
  // Editing an old plaintext entry on an encrypted account stores the text as
  // ciphertext and erases the readable copy, so no stale plaintext is left behind.
  const change =
    saved.kind === "encrypted"
      ? { body_enc: saved.bodyCipher, body: null, occurred_on: saved.occurredOn, occurred_time: saved.occurredTime }
      : { body: saved.body, occurred_on: saved.occurredOn, occurred_time: saved.occurredTime };
  const { data: updated, error } = await supabase
    .from("entries")
    .update(change)
    .eq("id", id)
    .select("id, cats:entry_categories(category_id)")
    .maybeSingle();
  if (error) return { error: "entry.errors.save" };
  if (!updated) return { error: "entry.notFound" };

  const current = new Set(updated.cats.map((c) => c.category_id));
  const wanted = new Set(saved.categoryIds);
  const toRemove = [...current].filter((c) => !wanted.has(c));
  const toAdd = [...wanted].filter((c) => !current.has(c));
  if (toRemove.length > 0) {
    const { error: e } = await supabase.from("entry_categories").delete().eq("entry_id", id).in("category_id", toRemove);
    if (e) return { error: "entry.errors.categories" };
  }
  if (toAdd.length > 0) {
    const { error: e } = await supabase
      .from("entry_categories")
      .insert(toAdd.map((category_id) => ({ entry_id: id, category_id })));
    if (e) return { error: "entry.errors.categories" };
  }
  revalidatePath("/app");
  redirect(safeFeedPath(formData.get("returnTo")));
}

/** Stars or unstars an entry; the database lets this happen only for the user's own entries. */
export async function setStar(entryId: string, starred: boolean): Promise<void> {
  await requireUserId();
  const supabase = await createClient();
  const { error } = starred
    ? await supabase.from("stars").insert({ entry_id: entryId })
    : await supabase.from("stars").delete().eq("entry_id", entryId);
  // Already starred (say, in another tab) is what the user wanted.
  if (error && error.code !== "23505") throw new Error(`star: ${error.code}`);
  revalidatePath("/app");
}

export async function deleteEntry(id: string, returnTo: string): Promise<void> {
  await requireUserId();
  const supabase = await createClient();
  const { error } = await supabase.from("entries").delete().eq("id", id);
  if (error) throw new Error(`delete entry: ${error.code}`);
  revalidatePath("/app");
  redirect(safeFeedPath(returnTo));
}
