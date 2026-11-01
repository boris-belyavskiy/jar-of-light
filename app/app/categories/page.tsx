import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageLayout } from "@/components/page-layout";
import { CategoryManager } from "@/components/journal/category-manager";
import { listCategories } from "@/lib/db/queries";
import { safeFeedPath } from "@/lib/feed-filter";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("categories"))("title") };
}


export default async function CategoriesPage({ searchParams }: PageProps<"/app/categories">) {
  const { back } = await searchParams;
  // Only a way back into the feed (an entry being written) is allowed, never an outside URL.
  const backHref = typeof back === "string" && safeFeedPath(back) === back ? back : null;
  const [categories, t] = await Promise.all([listCategories(), getTranslations("categories")]);

  return (
    <PageLayout
      head={
        <>
          {backHref && (
            <Link href={backHref} className="mb-2 inline-block text-sm text-primary underline-offset-4 hover:underline">
              ← {t("backToEntry")}
            </Link>
          )}
          <h1 className="font-heading text-2xl font-semibold">{t("title")}</h1>
        </>
      }
    >
      <CategoryManager categories={categories} />
    </PageLayout>
  );
}
