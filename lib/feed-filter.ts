/**
 * The feed filter lives in the URL, e.g. /app?category=<id>&category=<id>&from=2026-10-01&to=2026-10-27,
 * so it survives a reload and works without JavaScript. Several categories mean
 * "an entry with any of them"; dates are inclusive and compare the entry's local date.
 */
export type FeedFilter = { categoryIds: string[]; from?: string; to?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_CATEGORIES = 20;

type SearchParams = Record<string, string | string[] | undefined>;

function all(value: string | string[] | undefined) {
  return value === undefined ? [] : Array.isArray(value) ? value : [value];
}

function date(value: string | string[] | undefined) {
  const v = all(value)[0];
  return v && DATE.test(v) && !Number.isNaN(Date.parse(v)) ? v : undefined;
}

export function parseFeedFilter(params: SearchParams): FeedFilter {
  const categoryIds = [...new Set(all(params.category).filter((id) => UUID.test(id)))].slice(0, MAX_CATEGORIES);
  let from = date(params.from);
  let to = date(params.to);
  // A reversed range is almost always a slip: show what the user meant.
  if (from && to && from > to) [from, to] = [to, from];
  return { categoryIds, from, to };
}

export function feedHref(filter: FeedFilter) {
  const query = new URLSearchParams();
  for (const id of filter.categoryIds) query.append("category", id);
  if (filter.from) query.set("from", filter.from);
  if (filter.to) query.set("to", filter.to);
  const qs = query.toString();
  return qs ? `/app?${qs}` : "/app";
}

/** The filter after tapping a category chip: adds it, or removes it if already selected. */
export function toggleCategory(filter: FeedFilter, id: string): FeedFilter {
  const categoryIds = filter.categoryIds.includes(id)
    ? filter.categoryIds.filter((c) => c !== id)
    : [...filter.categoryIds, id];
  return { ...filter, categoryIds };
}

export function isFiltered(filter: FeedFilter) {
  return filter.categoryIds.length > 0 || Boolean(filter.from || filter.to);
}
