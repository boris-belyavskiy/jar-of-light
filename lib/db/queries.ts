import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FALLBACK_TIME_ZONE } from "@/lib/time";
import { isLocale, type Locale } from "@/i18n/config";

export type Profile = { id: string; displayName: string; locale: Locale | null; timezone: string };

export type Category = {
  id: string;
  slug: string | null;
  name: string | null;
  isSystem: boolean;
  hidden: boolean;
};

export type Entry = {
  id: string;
  body: string;
  occurredOn: string;
  occurredTime: string;
  categoryIds: string[];
};

/** The signed-in user's id; sends signed-out visitors to the landing page. */
export const requireUserId = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  if (!sub) redirect("/");
  return sub;
});

export const getProfile = cache(async (): Promise<Profile> => {
  const userId = await requireUserId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, locale, timezone")
    .eq("id", userId)
    .single();
  if (error) throw new Error(`profile: ${error.code}`);
  return {
    id: data.id,
    displayName: data.display_name,
    locale: isLocale(data.locale) ? data.locale : null,
    timezone: data.timezone ?? FALLBACK_TIME_ZONE,
  };
});

/** System categories first (in their fixed order), then the user's own by creation time. */
export const listCategories = cache(async (): Promise<Category[]> => {
  await requireUserId();
  const supabase = await createClient();
  const [categories, hidden] = await Promise.all([
    supabase
      .from("categories")
      .select("id, slug, name, user_id")
      .order("user_id", { ascending: true, nullsFirst: true })
      .order("sort", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase.from("hidden_categories").select("category_id"),
  ]);
  if (categories.error) throw new Error(`categories: ${categories.error.code}`);
  if (hidden.error) throw new Error(`hidden_categories: ${hidden.error.code}`);
  const hiddenIds = new Set(hidden.data.map((h) => h.category_id));
  return categories.data.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    isSystem: c.user_id === null,
    hidden: hiddenIds.has(c.id),
  }));
});

const ENTRY_COLUMNS = "id, body, occurred_on, occurred_time, cats:entry_categories(category_id)";

type EntryRow = {
  id: string;
  body: string;
  occurred_on: string;
  occurred_time: string;
  cats: { category_id: string }[];
};

function toEntry(row: EntryRow): Entry {
  return {
    id: row.id,
    body: row.body,
    occurredOn: row.occurred_on,
    occurredTime: row.occurred_time.slice(0, 5),
    categoryIds: row.cats.map((c) => c.category_id),
  };
}

/** Feed: newest first by the entry's own date and time (ENT-04). */
export async function listEntries(categoryId?: string): Promise<Entry[]> {
  await requireUserId();
  const supabase = await createClient();
  // The second, inner-joined embed only filters; `cats` still lists every category of the entry.
  const columns = categoryId ? `${ENTRY_COLUMNS}, f:entry_categories!inner(category_id)` : ENTRY_COLUMNS;
  let query = supabase
    .from("entries")
    .select(columns)
    .order("occurred_on", { ascending: false })
    .order("occurred_time", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);
  if (categoryId) query = query.eq("f.category_id", categoryId);
  const { data, error } = await query;
  if (error) throw new Error(`entries: ${error.code}`);
  return (data as unknown as EntryRow[]).map(toEntry);
}

export async function getEntry(id: string): Promise<Entry | null> {
  await requireUserId();
  const supabase = await createClient();
  const { data, error } = await supabase.from("entries").select(ENTRY_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(`entry: ${error.code}`);
  return data ? toEntry(data as unknown as EntryRow) : null;
}
