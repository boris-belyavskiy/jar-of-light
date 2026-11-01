import type { Category } from "@/lib/db/queries";

type Translate = (key: string) => string;

/**
 * The name to show in the interface language: the user's own name in that
 * language; for a built-in category without one, its translation; otherwise
 * the name in the other language.
 */
export function categoryLabel(category: Pick<Category, "slug" | "nameRu" | "nameEn">, t: Translate, locale: string) {
  const own = locale === "ru" ? category.nameRu : category.nameEn;
  if (own) return own;
  if (category.slug) return t(`system.${category.slug}`);
  return (locale === "ru" ? category.nameEn : category.nameRu) ?? "";
}
