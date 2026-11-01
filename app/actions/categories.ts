"use server";

import { revalidatePath } from "next/cache";
import { isSameSet } from "@/lib/category-order";
import { listCategories, requireUserId } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";
import { categoryNamesSchema, systemCategoryNamesSchema } from "@/lib/validation";
import type { FormState } from "./state";

function errorKey(code: string) {
  return code === "23505" ? "categories.errors.duplicate" : "categories.errors.save";
}

function refresh() {
  revalidatePath("/app", "layout");
}

function readNames(formData: FormData) {
  return { nameRu: formData.get("nameRu") ?? "", nameEn: formData.get("nameEn") ?? "" };
}

export async function createCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = categoryNamesSchema.safeParse(readNames(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .insert({ user_id: userId, name_ru: parsed.data.nameRu, name_en: parsed.data.nameEn });
  if (error) return { error: errorKey(error.code) };
  refresh();
  return { ok: true };
}

export async function renameCategory(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireUserId();
  const parsed = categoryNamesSchema.safeParse(readNames(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ name_ru: parsed.data.nameRu, name_en: parsed.data.nameEn })
    .eq("id", id);
  if (error) return { error: errorKey(error.code) };
  refresh();
  return { ok: true };
}

/** The user's own names for a built-in category; both empty brings back the built-in name. */
export async function renameSystemCategory(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireUserId();
  const parsed = systemCategoryNamesSchema.safeParse(readNames(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { nameRu, nameEn } = parsed.data;
  const supabase = await createClient();
  // A fresh builder per request: builders share their URL, so one filter would leak into the next call.
  const names = () => supabase.from("category_names");

  if (!nameRu && !nameEn) {
    const { error } = await names().delete().eq("category_id", id);
    if (error) return { error: errorKey(error.code) };
  } else {
    // Update first, insert if there was nothing to update: an upsert would also
    // try to update the key columns, which users may not change.
    const updated = await names().update({ name_ru: nameRu, name_en: nameEn }).eq("category_id", id).select("category_id");
    if (updated.error) return { error: errorKey(updated.error.code) };
    if (updated.data.length === 0) {
      const { error } = await names().insert({ category_id: id, name_ru: nameRu, name_en: nameEn });
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
