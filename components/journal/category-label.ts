import type { Category } from "@/lib/db/queries";

type Translate = (key: string) => string;

/**
 * The name to show in the interface language: the user's own name in that
 * language; for a built-in category without one, its translation; otherwise
 * the name in the other language.
 */
export function categoryLabel(
  category: Pick<Category, "slug" | "nameRu" | "nameEn"> & { locked?: boolean },
  t: Translate,
  locale: string,
) {
  const own = locale === "ru" ? category.nameRu : category.nameEn;
  if (own) return own;
  if (category.slug) return t(`system.${category.slug}`);
  const other = (locale === "ru" ? category.nameEn : category.nameRu) ?? "";
  // Names stored only as ciphertext cannot be read until the device has the key (ADR-0011).
  return other || (category.locked ? t("locked") : "");
}
