import type { Category } from "@/lib/db/queries";

type Translate = (key: string) => string;

/** System categories are translated by slug; custom ones show the user's name. */
export function categoryLabel(category: Pick<Category, "slug" | "name">, t: Translate) {
  return category.slug ? t(`system.${category.slug}`) : (category.name ?? "");
}
