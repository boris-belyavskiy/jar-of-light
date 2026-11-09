import type { FeedFilter } from "@/lib/feed-filter";

/**
 * Search by words on the device (ADR-0011, ADR-0013). An account with keys
 * cannot be searched by the server, which only holds ciphertext, so the device
 * fetches the entries the other filters select, decrypts them and matches the
 * words itself. The words never leave the device, and are not in the address.
 */

/** Rows fetched from the server per request. Each is at most about 24 KB of ciphertext. */
export const SEARCH_PAGE_SIZE = 500;
/** The feed shows this many matches, as it showed this many entries before. */
export const SEARCH_RESULT_LIMIT = 200;

/** Case-insensitive, and the same letter typed two ways matches itself. */
function fold(text: string) {
  return text.normalize("NFKC").toLocaleLowerCase();
}

/** Whether `text` contains the words as typed, as one phrase, like the server's ILIKE did. */
export function matchesQuery(text: string | null, query: string): boolean {
  const q = fold(query.trim());
  if (!q) return true;
  return text !== null && fold(text).includes(q);
}

/** The filter as the address would carry it, without the search words, for the server to read back. */
export function filterToParams(filter: FeedFilter): Record<string, string | string[] | undefined> {
  return {
    category: filter.categoryIds,
    from: filter.from,
    to: filter.to,
    sort: filter.sort,
    starred: filter.starred ? "1" : undefined,
  };
}

/** A stable key for "the same filter": it changes only when the rows to fetch change. */
export function filterKey(filter: FeedFilter): string {
  return JSON.stringify([filter.categoryIds, filter.from ?? "", filter.to ?? "", filter.sort ?? "", filter.starred ? 1 : 0]);
}
