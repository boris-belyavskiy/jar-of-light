"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";
import { categoryNameSchema } from "@/lib/validation";
import type { FormState } from "./state";

function errorKey(code: string) {
  return code === "23505" ? "categories.errors.duplicate" : "categories.errors.save";
}

function refresh() {
  revalidatePath("/app", "layout");
}

export async function createCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = categoryNameSchema.safeParse(formData.get("name") ?? "");
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert({ user_id: userId, name: parsed.data });
  if (error) return { error: errorKey(error.code) };
  refresh();
  return { ok: true };
}

export async function renameCategory(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireUserId();
  const parsed = categoryNameSchema.safeParse(formData.get("name") ?? "");
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createClient();
  const { error } = await supabase.from("categories").update({ name: parsed.data }).eq("id", id);
  if (error) return { error: errorKey(error.code) };
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
