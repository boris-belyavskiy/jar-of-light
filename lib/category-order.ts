/**
 * The user's own order of categories, stored as an array of ids on the profile.
 * Ids the array does not know (a new category, a stale id) keep their default
 * place after the ordered ones, so the stored order never has to be complete.
 */
export function sortByOrder<T extends { id: string }>(items: T[], order: string[]): T[] {
  const position = new Map(order.map((id, i) => [id, i]));
  return items
    .map((item, i) => ({ item, key: position.get(item.id) ?? order.length + i }))
    .sort((a, b) => a.key - b.key)
    .map(({ item }) => item);
}

/** A new order is accepted only if it lists exactly the user's categories, each once. */
export function isSameSet(next: string[], current: string[]) {
  const set = new Set(next);
  return set.size === next.length && next.length === current.length && current.every((id) => set.has(id));
}
