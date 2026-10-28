import Link from "next/link";
import { Plus } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { categoryLabel } from "@/components/journal/category-label";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { listCategories, listEntries } from "@/lib/db/queries";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function FeedPage({ searchParams }: PageProps<"/app">) {
  const { category } = await searchParams;
  const filter = typeof category === "string" && UUID.test(category) ? category : undefined;

  const [entries, categories, t, tc, tn, format] = await Promise.all([
    listEntries(filter),
    listCategories(),
    getTranslations("feed"),
    getTranslations("categories"),
    getTranslations("nav"),
    getFormatter(),
  ]);
  const byId = new Map(categories.map((c) => [c.id, c]));
  const chips = categories.filter((c) => !c.hidden || c.id === filter);

  return (
    <>
      <h1 className="font-heading text-2xl font-semibold">{t("title")}</h1>

      <nav aria-label={t("filterLabel")} className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <FilterChip href="/app" active={!filter} label={t("all")} />
        {chips.map((c) => (
          <FilterChip key={c.id} href={`/app?category=${c.id}`} active={c.id === filter} label={categoryLabel(c, tc)} />
        ))}
      </nav>

      {entries.length === 0 ? (
        <div className="mt-12 flex flex-col items-center gap-4 text-center">
          <p className="text-muted-foreground">{filter ? t("emptyFiltered") : t("empty")}</p>
          {!filter && (
            <Link href="/app/entry/new" className={buttonVariants()}>
              {t("writeFirst")}
            </Link>
          )}
        </div>
      ) : (
        <ol className="mt-6 flex flex-col gap-3">
          {entries.map((entry) => (
            <li key={entry.id}>
              <Link
                href={`/app/entry/${entry.id}`}
                className="block rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border transition-colors hover:ring-primary/40 dark:shadow-none"
              >
                <p className="text-sm text-muted-foreground">
                  {/* The date is the user's local date: format it as-is, without shifting zones. */}
                  {format.dateTime(new Date(`${entry.occurredOn}T00:00:00Z`), {
                    dateStyle: "long",
                    timeZone: "UTC",
                  })}
                  {" · "}
                  {entry.occurredTime}
                </p>
                <p className="mt-2 font-serif text-[1.0625rem] leading-[1.6] whitespace-pre-wrap break-words">
                  {entry.body}
                </p>
                {entry.categoryIds.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {entry.categoryIds.map((id) => {
                      const c = byId.get(id);
                      return c ? (
                        <li key={id} className="rounded-full bg-sky px-2.5 py-0.5 text-xs">
                          {categoryLabel(c, tc)}
                        </li>
                      ) : null;
                    })}
                  </ul>
                )}
              </Link>
            </li>
          ))}
        </ol>
      )}

      <Link
        href="/app/entry/new"
        aria-label={tn("newEntry")}
        className="fixed right-5 bottom-6 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-light/40 transition-transform hover:scale-105"
      >
        <Plus className="size-6" strokeWidth={1.75} />
      </Link>
    </>
  );
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "shrink-0 rounded-full px-3.5 py-1.5 text-sm ring-1 ring-border transition-colors",
        active ? "bg-primary text-primary-foreground ring-primary" : "bg-card hover:bg-sky",
      )}
    >
      {label}
    </Link>
  );
}
