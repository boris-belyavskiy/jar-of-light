"use server";

import { listEntryRowsPage, requireUserId, type Entry } from "@/lib/db/queries";
import { parseFeedFilter, type FeedFilter } from "@/lib/feed-filter";
import { filterToParams, SEARCH_PAGE_SIZE } from "@/lib/feed-search";

// The device searches an encrypted account itself, so this action carries no
// search words: only the category, date and favorites filter, and a position.
// It returns the rows as stored, ciphertext included, for the device to open.

export async function fetchEntryRows(filter: FeedFilter, start: number): Promise<{ rows: Entry[]; done: boolean }> {
  await requireUserId();
  // The caller is the browser: read the filter back through the same checks as the address.
  const clean = parseFeedFilter(filterToParams(filter));
  const position = Number.isFinite(start) ? Math.max(0, Math.floor(start)) : 0;
  return listEntryRowsPage(clean, position, SEARCH_PAGE_SIZE);
}
