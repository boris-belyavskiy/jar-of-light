"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";
import { entrySchema } from "@/lib/validation";
import type { FormState } from "./state";

// Never log entry text: errors carry only codes.

async function validate(formData: FormData) {
  const parsed = entrySchema.safeParse({
    body: formData.get("body") ?? "",
    occurredOn: formData.get("occurredOn") ?? "",
    occurredTime: formData.get("occurredTime") ?? "",
    categoryIds: formData.getAll("categoryIds"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "entry.errors.save" } as const;
  return { data: parsed.data } as const;
}

export async function createEntry(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const result = await validate(formData);
  if ("error" in result) return { error: result.error };
  const { body, occurredOn, occurredTime, categoryIds } = result.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("entries")
    .insert({ user_id: userId, body, occurred_on: occurredOn, occurred_time: occurredTime })
    .select("id")
    .single();
  if (error) return { error: "entry.errors.save" };

  if (categoryIds.length > 0) {
    const links = categoryIds.map((category_id) => ({ entry_id: data.id, category_id }));
    const { error: linkError } = await supabase.from("entry_categories").insert(links);
    if (linkError) return { error: "entry.errors.categories" };
  }
  revalidatePath("/app");
  redirect("/app");
}

export async function updateEntry(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireUserId();
  const result = await validate(formData);
  if ("error" in result) return { error: result.error };
  const { body, occurredOn, occurredTime, categoryIds } = result.data;

  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("entries")
    .update({ body, occurred_on: occurredOn, occurred_time: occurredTime })
    .eq("id", id)
    .select("id, cats:entry_categories(category_id)")
    .maybeSingle();
  if (error) return { error: "entry.errors.save" };
  if (!updated) return { error: "entry.notFound" };

  const current = new Set(updated.cats.map((c) => c.category_id));
  const wanted = new Set(categoryIds);
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
  redirect("/app");
}

export async function deleteEntry(id: string): Promise<void> {
  await requireUserId();
  const supabase = await createClient();
  const { error } = await supabase.from("entries").delete().eq("id", id);
  if (error) throw new Error(`delete entry: ${error.code}`);
  revalidatePath("/app");
  redirect("/app");
}
