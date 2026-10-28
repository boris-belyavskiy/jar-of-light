import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CategoryManager } from "@/components/journal/category-manager";
import { listCategories } from "@/lib/db/queries";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("categories"))("title") };
}

export default async function CategoriesPage() {
  const [categories, t] = await Promise.all([listCategories(), getTranslations("categories")]);
  return (
    <>
      <h1 className="mb-6 font-heading text-2xl font-semibold">{t("title")}</h1>
      <CategoryManager categories={categories} />
    </>
  );
}
