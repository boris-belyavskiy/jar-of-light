"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isSameSet } from "@/lib/category-order";
import { getKeyRecord, listCategories, requireUserId } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";
import {
  categoryNamesSchema,
  encryptedCategoryNamesSchema,
  encryptedSystemNamesSchema,
  systemCategoryNamesSchema,
} from "@/lib/validation";
import type { FormState } from "./state";

// An account with encryption keys saves category names as ciphertext made on
// the device, and the server refuses plaintext names from it (ADR-0011).
// An account without keys saves plaintext as before.

function errorKey(code: string) {
  return code === "23505" ? "categories.errors.duplicate" : "categories.errors.save";
}

function refresh() {
  revalidatePath("/app", "layout");
}

function readNames(formData: FormData) {
  return { nameRu: formData.get("nameRu") ?? "", nameEn: formData.get("nameEn") ?? "" };
}

function readCiphers(formData: FormData) {
  return { nameRuCipher: formData.get("nameRuCipher"), nameEnCipher: formData.get("nameEnCipher") };
}

/** "encrypted" for an account with keys; a mismatch with what the client sent is an error code. */
async function mode(formData: FormData): Promise<{ encrypted: boolean } | { error: string }> {
  const encrypted = (await getKeyRecord()) !== null;
  if (encrypted && (formData.has("nameRu") || formData.has("nameEn"))) return { error: "encryption.errors.plaintext" };
  if (!encrypted && (formData.has("nameRuCipher") || formData.has("nameEnCipher"))) return { error: "encryption.errors.generic" };
  return { encrypted };
}

export async function createCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const how = await mode(formData);
  if ("error" in how) return { error: how.error };
  const supabase = await createClient();

  if (how.encrypted) {
    const id = z.uuid().safeParse(formData.get("categoryId"));
    const parsed = encryptedCategoryNamesSchema.safeParse(readCiphers(formData));
    if (!id.success) return { error: "encryption.errors.generic" };
    if (!parsed.success) return { error: parsed.error.issues[0]?.message };
    const { error } = await supabase.from("categories").insert({
      id: id.data,
      user_id: userId,
      name_ru_enc: parsed.data.nameRuCipher ?? null,
      name_en_enc: parsed.data.nameEnCipher ?? null,
    });
    if (error) return { error: errorKey(error.code) };
  } else {
    const parsed = categoryNamesSchema.safeParse(readNames(formData));
    if (!parsed.success) return { error: parsed.error.issues[0]?.message };
    const { error } = await supabase
      .from("categories")
      .insert({ user_id: userId, name_ru: parsed.data.nameRu, name_en: parsed.data.nameEn });
    if (error) return { error: errorKey(error.code) };
  }
  refresh();
  return { ok: true };
}

export async function renameCategory(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireUserId();
  const how = await mode(formData);
  if ("error" in how) return { error: how.error };
  const supabase = await createClient();

  if (how.encrypted) {
    const parsed = encryptedCategoryNamesSchema.safeParse(readCiphers(formData));
    if (!parsed.success) return { error: parsed.error.issues[0]?.message };
    // The readable names are erased: a rename must not leave the old words behind.
    const { error } = await supabase
      .from("categories")
      .update({
        name_ru: null,
        name_en: null,
        name_ru_enc: parsed.data.nameRuCipher ?? null,
        name_en_enc: parsed.data.nameEnCipher ?? null,
      })
      .eq("id", id);
    if (error) return { error: errorKey(error.code) };
  } else {
    const parsed = categoryNamesSchema.safeParse(readNames(formData));
    if (!parsed.success) return { error: parsed.error.issues[0]?.message };
    const { error } = await supabase
      .from("categories")
      .update({ name_ru: parsed.data.nameRu, name_en: parsed.data.nameEn })
      .eq("id", id);
    if (error) return { error: errorKey(error.code) };
  }
  refresh();
  return { ok: true };
}

/** The user's own names for a built-in category; both empty brings back the built-in name. */
export async function renameSystemCategory(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireUserId();
  const how = await mode(formData);
  if ("error" in how) return { error: how.error };

  let change: { name_ru: string | null; name_en: string | null; name_ru_enc: string | null; name_en_enc: string | null } | null;
  if (how.encrypted) {
    const parsed = encryptedSystemNamesSchema.safeParse(readCiphers(formData));
    if (!parsed.success) return { error: parsed.error.issues[0]?.message };
    const { nameRuCipher, nameEnCipher } = parsed.data;
    change =
      nameRuCipher || nameEnCipher
        ? { name_ru: null, name_en: null, name_ru_enc: nameRuCipher ?? null, name_en_enc: nameEnCipher ?? null }
        : null;
  } else {
    const parsed = systemCategoryNamesSchema.safeParse(readNames(formData));
    if (!parsed.success) return { error: parsed.error.issues[0]?.message };
    const { nameRu, nameEn } = parsed.data;
    change = nameRu || nameEn ? { name_ru: nameRu, name_en: nameEn, name_ru_enc: null, name_en_enc: null } : null;
  }

  const supabase = await createClient();
  // A fresh builder per request: builders share their URL, so one filter would leak into the next call.
  const names = () => supabase.from("category_names");

  if (!change) {
    const { error } = await names().delete().eq("category_id", id);
    if (error) return { error: errorKey(error.code) };
  } else {
    // Update first, insert if there was nothing to update: an upsert would also
    // try to update the key columns, which users may not change.
    const updated = await names().update(change).eq("category_id", id).select("category_id");
    if (updated.error) return { error: errorKey(updated.error.code) };
    if (updated.data.length === 0) {
      const { error } = await names().insert({ category_id: id, ...change });
      if (error) return { error: errorKey(error.code) };
    }
  }
  refresh();
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<void> {
  await requireUserId();
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(`delete category: ${error.code}`);
  refresh();
}

export async function setCategoryHidden(id: string, hidden: boolean): Promise<void> {
  await requireUserId();
  const supabase = await createClient();
  const { error } = hidden
    ? await supabase.from("hidden_categories").insert({ category_id: id })
    : await supabase.from("hidden_categories").delete().eq("category_id", id);
  // 23505: already hidden (a double click) is fine.
  if (error && error.code !== "23505") throw new Error(`hide category: ${error.code}`);
  refresh();
}

/** Saves the user's new order of categories after a drag and drop. */
export async function reorderCategories(ids: string[]): Promise<void> {
  const userId = await requireUserId();
  const current = (await listCategories()).map((c) => c.id);
  if (!isSameSet(ids, current)) throw new Error("reorder categories: stale list");
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ category_order: ids }).eq("id", userId);
  if (error) throw new Error(`reorder categories: ${error.code}`);
  refresh();
}
