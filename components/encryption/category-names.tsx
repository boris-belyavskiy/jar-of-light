"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { categoryLabel } from "@/components/journal/category-label";
import type { Category } from "@/lib/db/queries";
import { useKeys } from "./key-provider";

/**
 * Category names saved by an encrypted account arrive as ciphertext; this
 * decrypts them once, on the device, and hands every screen the same readable
 * names (ADR-0011). Plaintext names (old categories, accounts without keys)
 * are used as they are. A name that cannot be decrypted stays "locked".
 */
type Names = { ru: string | null; en: string | null };

const Context = createContext<{ categories: Category[]; decrypted: Map<string, Names> }>({
  categories: [],
  decrypted: new Map(),
});

export function CategoryNamesProvider({ categories, children }: { categories: Category[]; children: ReactNode }) {
  const { dataKey, decrypt } = useKeys();
  const [decrypted, setDecrypted] = useState<Map<string, Names>>(new Map());
  // Decrypt again only when a ciphertext changes, not on every render of the server page.
  const cipherKey = categories.map((c) => `${c.id}|${c.nameRuCipher}|${c.nameEnCipher}`).join(",");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next = new Map<string, Names>();
      if (dataKey) {
        for (const c of categories) {
          if (!c.nameRuCipher && !c.nameEnCipher) continue;
          const table = c.isSystem ? ("category_names" as const) : ("categories" as const);
          const open = async (cipher: string | null, field: "name_ru" | "name_en") => {
            if (!cipher) return null;
            try {
              return await decrypt({ table, rowId: c.id, field }, cipher);
            } catch {
              return null; // changed or from another key: it stays locked, and nothing is logged
            }
          };
          next.set(c.id, { ru: await open(c.nameRuCipher, "name_ru"), en: await open(c.nameEnCipher, "name_en") });
        }
      }
      if (!cancelled) setDecrypted(next);
    })();
    return () => {
      cancelled = true;
    };
    // `categories` and `decrypt` change identity on every render; the cipher key and the data key are what matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cipherKey, dataKey]);

  const value = useMemo(() => ({ categories, decrypted }), [categories, decrypted]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

type Named = Pick<Category, "id" | "slug" | "nameRu" | "nameEn" | "locked">;

/** A category's names as readable text: plaintext first, then what was decrypted. */
export function useCategoryNames(category: Pick<Category, "id" | "nameRu" | "nameEn">): Names {
  const { decrypted } = useContext(Context);
  const d = decrypted.get(category.id);
  return { ru: category.nameRu ?? d?.ru ?? null, en: category.nameEn ?? d?.en ?? null };
}

/** The name to show in the interface language, as `categoryLabel` decides, with decrypted names filled in. */
export function useCategoryLabeler() {
  const { decrypted } = useContext(Context);
  const t = useTranslations("categories");
  const locale = useLocale();
  return (category: Named) => {
    const d = decrypted.get(category.id);
    const nameRu = category.nameRu ?? d?.ru ?? null;
    const nameEn = category.nameEn ?? d?.en ?? null;
    return categoryLabel({ slug: category.slug, nameRu, nameEn, locked: category.locked && !nameRu && !nameEn }, t, locale);
  };
}

/** The own categories as readable names, for the duplicate check of the encrypted write path. */
export function useOwnCategoryNames(): { id: string; ru: string | null; en: string | null }[] {
  const { categories, decrypted } = useContext(Context);
  return categories
    .filter((c) => !c.isSystem)
    .map((c) => ({ id: c.id, ru: c.nameRu ?? decrypted.get(c.id)?.ru ?? null, en: c.nameEn ?? decrypted.get(c.id)?.en ?? null }));
}

/** A category's name as text, for use inside server-rendered pages. */
export function CategoryName({ category }: { category: Named }) {
  const label = useCategoryLabeler();
  return <>{label(category)}</>;
}
