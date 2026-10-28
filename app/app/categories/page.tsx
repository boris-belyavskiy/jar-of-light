import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CategoryManager } from "@/components/journal/category-manager";
import { listCategories } from "@/lib/db/queries";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("categories"))("title") };
}

// Only links back into the entry form are allowed, never an outside URL.
const BACK = /^\/app\/entry\/(new|[0-9a-f-]{36})$/i;

export default async function CategoriesPage({ searchParams }: PageProps<"/app/categories">) {
  const { back } = await searchParams;
  const backHref = typeof back === "string" && BACK.test(back) ? back : null;
  const [categories, t] = await Promise.all([listCategories(), getTranslations("categories")]);

  return (
    <>
      {backHref && (
        <Link href={backHref} className="mb-4 inline-block text-sm text-primary underline-offset-4 hover:underline">
          ← {t("backToEntry")}
        </Link>
      )}
      <h1 className="mb-6 font-heading text-2xl font-semibold">{t("title")}</h1>
      <CategoryManager categories={categories} />
    </>
  );
}
