import Link from "next/link";
import { Check } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { categoryLabel } from "@/components/journal/category-label";
import { JarMark } from "@/components/jar-mark";
import { PageLayout } from "@/components/page-layout";
import { Button, buttonVariants } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { listCategories, listEntries } from "@/lib/db/queries";
import { feedHref, isFiltered, parseFeedFilter, toggleCategory } from "@/lib/feed-filter";

export default async function FeedPage({ searchParams }: PageProps<"/app">) {
  const filter = parseFeedFilter(await searchParams);
  const filtered = isFiltered(filter);
  const hasDates = Boolean(filter.from || filter.to);

  const [entries, categories, t, tc, format] = await Promise.all([
    listEntries(filter),
    listCategories(),
    getTranslations("feed"),
    getTranslations("categories"),
    getFormatter(),
  ]);
  const byId = new Map(categories.map((c) => [c.id, c]));
  const items = categories.filter((c) => !c.hidden || filter.categoryIds.includes(c.id));

  const head = (
    <>
      <h1 className="font-heading text-2xl font-semibold">{t("title")}</h1>
      <Link
        href="/app/entry/new"
        className="mt-4 flex items-center gap-3 rounded-2xl bg-card p-3 shadow-sm ring-1 ring-border transition-colors hover:ring-primary/40 dark:shadow-none"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sky text-primary">
          <JarMark className="size-6" />
        </span>
        <span className="flex-1 rounded-full bg-background px-4 py-2.5 text-muted-foreground">
          {t("composerPrompt")}
        </span>
      </Link>
    </>
  );

  const filters = (
    <>
      <h2 id="filters-title" className="text-sm font-semibold">
        {t("filtersTitle")}
      </h2>

      {/* A plain GET form: the dates go into the URL next to the selected categories. */}
      <form action="/app" className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-1">
        {filter.categoryIds.map((id) => (
          <input key={id} type="hidden" name="category" value={id} />
        ))}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="from" className="text-xs text-muted-foreground">
            {t("from")}
          </Label>
          <DatePicker id="from" name="from" defaultValue={filter.from} clearable />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="to" className="text-xs text-muted-foreground">
            {t("to")}
          </Label>
          <DatePicker id="to" name="to" defaultValue={filter.to} clearable />
        </div>
        <div className="col-span-2 flex gap-2 md:col-span-1">
          <Button type="submit" variant="outline" className="flex-1 md:flex-none">
            {t("applyDates")}
          </Button>
          {hasDates && (
            <Link href={feedHref({ categoryIds: filter.categoryIds })} className={buttonVariants({ variant: "ghost" })}>
              {t("resetDates")}
            </Link>
          )}
        </div>
      </form>

      <nav aria-label={t("filterLabel")} className="mt-5">
        <p className="mb-2 text-xs text-muted-foreground">{t("categoriesTitle")}</p>
        <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-col md:gap-0.5 md:overflow-visible md:px-0">
          <li className="shrink-0">
            <FilterItem
              href={feedHref({ ...filter, categoryIds: [] })}
              active={filter.categoryIds.length === 0}
              label={t("all")}
            />
          </li>
          {items.map((c) => (
            <li key={c.id} className="shrink-0">
              <FilterItem
                href={feedHref(toggleCategory(filter, c.id))}
                active={filter.categoryIds.includes(c.id)}
                label={categoryLabel(c, tc)}
              />
            </li>
          ))}
        </ul>
        {filter.categoryIds.length > 1 && <p className="mt-2 text-xs text-muted-foreground">{t("anyOf")}</p>}
        <Link
          href="/app/categories"
          className="mt-3 hidden text-sm text-primary underline-offset-4 hover:underline md:inline-block"
        >
          {t("editCategories")}
        </Link>
      </nav>
    </>
  );

  return (
    <PageLayout head={head} aside={filters} asideLabel={t("filtersTitle")}>
    <section aria-labelledby="feed-title">
      <h2 id="feed-title" className="sr-only">
        {t("title")}
      </h2>
      {entries.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-4 text-center">
          <p className="text-muted-foreground">{filtered ? t("emptyFiltered") : t("empty")}</p>
          {!filtered && (
            <Link href="/app/entry/new" className={buttonVariants()}>
              {t("writeFirst")}
            </Link>
          )}
        </div>
      ) : (
        <ol className="flex flex-col gap-3">
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
    </section>
    </PageLayout>
  );
}

/** A chip on phones, a menu row on wider screens; several can be on at once. */
function FilterItem({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm whitespace-nowrap ring-1 ring-border transition-colors md:rounded-lg md:px-3 md:whitespace-normal md:ring-0",
        active
          ? "bg-primary text-primary-foreground ring-primary md:bg-sky md:font-medium md:text-foreground"
          : "bg-card hover:bg-sky md:bg-transparent",
      )}
    >
      <span className="flex-1">{label}</span>
      {active && <Check className="hidden size-4 text-primary md:block" aria-hidden="true" />}
    </Link>
  );
}
