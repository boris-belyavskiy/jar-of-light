import Link from "next/link";
import { Plus } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { categoryLabel } from "@/components/journal/category-label";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { listCategories, listEntries } from "@/lib/db/queries";
import { feedHref, isFiltered, parseFeedFilter, toggleCategory } from "@/lib/feed-filter";

export default async function FeedPage({ searchParams }: PageProps<"/app">) {
  const filter = parseFeedFilter(await searchParams);
  const filtered = isFiltered(filter);
  const hasDates = Boolean(filter.from || filter.to);

  const [entries, categories, t, tc, tn, format] = await Promise.all([
    listEntries(filter),
    listCategories(),
    getTranslations("feed"),
    getTranslations("categories"),
    getTranslations("nav"),
    getFormatter(),
  ]);
  const byId = new Map(categories.map((c) => [c.id, c]));
  const chips = categories.filter((c) => !c.hidden || filter.categoryIds.includes(c.id));

  return (
    <>
      <h1 className="font-heading text-2xl font-semibold">{t("title")}</h1>

      <nav aria-label={t("filterLabel")} className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <FilterChip
          href={feedHref({ ...filter, categoryIds: [] })}
          active={filter.categoryIds.length === 0}
          label={t("all")}
        />
        {chips.map((c) => (
          <FilterChip
            key={c.id}
            href={feedHref(toggleCategory(filter, c.id))}
            active={filter.categoryIds.includes(c.id)}
            label={categoryLabel(c, tc)}
          />
        ))}
      </nav>
      {filter.categoryIds.length > 1 && <p className="mt-2 text-xs text-muted-foreground">{t("anyOf")}</p>}

      {/* A plain GET form: the dates go into the URL next to the selected categories. */}
      <form action="/app" className="mt-4 flex flex-wrap items-end gap-3">
        {filter.categoryIds.map((id) => (
          <input key={id} type="hidden" name="category" value={id} />
        ))}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="from" className="text-xs text-muted-foreground">
            {t("from")}
          </Label>
          <Input id="from" name="from" type="date" defaultValue={filter.from} className="w-40 bg-card" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="to" className="text-xs text-muted-foreground">
            {t("to")}
          </Label>
          <Input id="to" name="to" type="date" defaultValue={filter.to} className="w-40 bg-card" />
        </div>
        <Button type="submit" variant="outline">
          {t("applyDates")}
        </Button>
        {hasDates && (
          <Link href={feedHref({ categoryIds: filter.categoryIds })} className={buttonVariants({ variant: "ghost" })}>
            {t("resetDates")}
          </Link>
        )}
      </form>

      {entries.length === 0 ? (
        <div className="mt-12 flex flex-col items-center gap-4 text-center">
          <p className="text-muted-foreground">{filtered ? t("emptyFiltered") : t("empty")}</p>
          {!filtered && (
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
