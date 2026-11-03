import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { sortByOrder } from "@/lib/category-order";
import { likePattern, type FeedFilter } from "@/lib/feed-filter";
import { createClient } from "@/lib/supabase/server";
import { FALLBACK_TIME_ZONE } from "@/lib/time";
import { isLocale, type Locale } from "@/i18n/config";

export type Profile = {
  id: string;
  displayName: string;
  locale: Locale | null;
  timezone: string;
  categoryOrder: string[];
};

/**
 * A category with its names in Russian and English. For a custom category they
 * are its own names; for a built-in one, the user's renames (null = the
 * built-in translation). Show them with `categoryLabel`.
 */
export type Category = {
  id: string;
  slug: string | null;
  nameRu: string | null;
  nameEn: string | null;
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

/** The signed-in user's id, or null on public pages that also open signed out. */
export const getUserId = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims?.sub ?? null;
});

/** The signed-in user's id; sends signed-out visitors to the landing page. */
export const requireUserId = cache(async () => {
  const sub = await getUserId();
  if (!sub) redirect("/");
  return sub;
});

export const getProfile = cache(async (): Promise<Profile> => {
  const userId = await requireUserId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, locale, timezone, category_order")
    .eq("id", userId)
    .single();
  if (error) throw new Error(`profile: ${error.code}`);
  return {
    id: data.id,
    displayName: data.display_name,
    locale: isLocale(data.locale) ? data.locale : null,
    timezone: data.timezone ?? FALLBACK_TIME_ZONE,
    categoryOrder: data.category_order ?? [],
  };
});

/**
 * Categories in the user's own order (lib/category-order); without one, system
 * categories first in their fixed order, then the user's own by creation time.
 */
export const listCategories = cache(async (): Promise<Category[]> => {
  await requireUserId();
  const supabase = await createClient();
  const [categories, hidden, renamed, profile] = await Promise.all([
    supabase
      .from("categories")
      .select("id, slug, name_ru, name_en, user_id")
      .order("user_id", { ascending: true, nullsFirst: true })
      .order("sort", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase.from("hidden_categories").select("category_id"),
    supabase.from("category_names").select("category_id, name_ru, name_en"),
    getProfile(),
  ]);
  if (categories.error) throw new Error(`categories: ${categories.error.code}`);
  if (hidden.error) throw new Error(`hidden_categories: ${hidden.error.code}`);
  if (renamed.error) throw new Error(`category_names: ${renamed.error.code}`);
  const hiddenIds = new Set(hidden.data.map((h) => h.category_id));
  const renames = new Map(renamed.data.map((r) => [r.category_id, r]));
  const list = categories.data.map((c) => {
    const names = c.user_id === null ? renames.get(c.id) : c;
    return {
      id: c.id,
      slug: c.slug,
      nameRu: names?.name_ru ?? null,
      nameEn: names?.name_en ?? null,
      isSystem: c.user_id === null,
      hidden: hiddenIds.has(c.id),
    };
  });
  return sortByOrder(list, profile.categoryOrder);
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

/** Feed: by the entry's own date and time, newest first unless asked otherwise (ENT-04), filtered as in lib/feed-filter. */
export async function listEntries(filter: FeedFilter): Promise<Entry[]> {
  await requireUserId();
  const supabase = await createClient();
  const byCategory = filter.categoryIds.length > 0;
  const ascending = filter.sort === "oldest";
  // The second, inner-joined embed only filters; `cats` still lists every category of the entry.
  const columns = byCategory ? `${ENTRY_COLUMNS}, f:entry_categories!inner(category_id)` : ENTRY_COLUMNS;
  let query = supabase
    .from("entries")
    .select(columns)
    .order("occurred_on", { ascending })
    .order("occurred_time", { ascending })
    .order("created_at", { ascending })
    .limit(200);
  if (byCategory) query = query.in("f.category_id", filter.categoryIds);
  if (filter.from) query = query.gte("occurred_on", filter.from);
  if (filter.to) query = query.lte("occurred_on", filter.to);
  if (filter.q) query = query.ilike("body", likePattern(filter.q));
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
