import Link from "next/link";
import { Check, X } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { createEntry, updateEntry } from "@/app/actions/entries";
import { categoryLabel } from "@/components/journal/category-label";
import { EntryForm } from "@/components/journal/entry-form";
import { EntryMenu } from "@/components/journal/entry-menu";
import { FilterPanel } from "@/components/journal/filter-panel";
import { PILL } from "@/components/journal/pill";
import { JarMark } from "@/components/jar-mark";
import { PageLayout } from "@/components/page-layout";
import { Button, buttonVariants } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getEntry, getProfile, listCategories, listEntries, type Category, type Entry } from "@/lib/db/queries";
import {
  feedHref,
  isFiltered,
  parseFeedFilter,
  parseFeedView,
  toggleCategory,
  type FeedFilter,
} from "@/lib/feed-filter";
import { entryDateLabel, nowInTimeZone } from "@/lib/time";

/**
 * The journal. Everything opens in place, inside the same frame (ADR-0005):
 * the composer bar expands into a new entry, an entry opens like a note, and
 * editing happens in that same card. The title, composer and filters stay put;
 * only the column below them scrolls.
 */
export default async function FeedPage({ searchParams }: PageProps<"/app">) {
  const params = await searchParams;
  const filter = parseFeedFilter(params);
  const view = parseFeedView(params);
  const filtered = isFiltered(filter);
  const hasDates = Boolean(filter.from || filter.to);
  const listHref = feedHref(filter);

  const [categories, t, tc, locale] = await Promise.all([
    listCategories(),
    getTranslations("feed"),
    getTranslations("categories"),
    getLocale(),
  ]);
  const byId = new Map(categories.map((c) => [c.id, c]));
  const items = categories.filter((c) => !c.hidden || filter.categoryIds.includes(c.id));

  const head = (
    <>
      <h1 className="font-heading text-2xl font-semibold">{t("title")}</h1>
      {/* While writing, the composer has expanded into the card below. */}
      {view.mode !== "new" && view.mode !== "edit" && (
        <Link
          href={feedHref(filter, { mode: "new" })}
          className="mt-4 flex items-center gap-3 rounded-2xl bg-card p-3 shadow-sm ring-1 ring-border transition-colors hover:ring-primary/40 dark:shadow-none"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sky text-primary">
            <JarMark className="size-6" />
          </span>
          <span className="flex-1 rounded-full bg-background px-4 py-2.5 text-muted-foreground">
            {t("composerPrompt")}
          </span>
        </Link>
      )}
    </>
  );

  const filters = (
    <FilterPanel title={t("filtersTitle")} active={filtered}>
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
        <ul className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:gap-0.5 md:overflow-visible">
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
        <Link href="/app/categories" className="mt-3 inline-block text-sm text-primary underline-offset-4 hover:underline">
          {t("editCategories")}
        </Link>
      </nav>
    </FilterPanel>
  );

  return (
    <PageLayout head={head} aside={filters} asideLabel={t("filtersTitle")}>
      <FeedBody
        view={view}
        filter={filter}
        listHref={listHref}
        categories={categories}
        byId={byId}
        locale={locale}
      />
    </PageLayout>
  );
}

async function FeedBody({
  view,
  filter,
  listHref,
  categories,
  byId,
  locale,
}: {
  view: ReturnType<typeof parseFeedView>;
  filter: FeedFilter;
  listHref: string;
  categories: Category[];
  byId: Map<string, Category>;
  locale: string;
}) {
  const t = await getTranslations("feed");
  const te = await getTranslations("entry");
  const tc = await getTranslations("categories");

  if (view.mode === "new") {
    const profile = await getProfile();
    // "Now" by default, in the user's time zone rather than the server's (ACC-04).
    const now = nowInTimeZone(profile.timezone);
    return (
      <EntryForm
        action={createEntry}
        categories={categories.filter((c) => !c.hidden)}
        initial={{ body: "", occurredOn: now.date, occurredTime: now.time, categoryIds: [] }}
        href={feedHref(filter, view)}
        closeHref={listHref}
      />
    );
  }

  if (view.mode === "view" || view.mode === "edit") {
    const entry = await getEntry(view.id);
    if (!entry) {
      return (
        <div className="mt-6 flex flex-col items-center gap-4 text-center">
          <p className="text-muted-foreground">{te("notFound")}</p>
          <Link href={listHref} className="text-primary underline-offset-4 hover:underline">
            ← {t("backToFeed")}
          </Link>
        </div>
      );
    }
    const viewHref = feedHref(filter, { mode: "view", id: entry.id });
    if (view.mode === "edit") {
      // Hidden categories stay selectable on entries that already use them.
      const options = categories.filter((c) => !c.hidden || entry.categoryIds.includes(c.id));
      return (
        <EntryForm
          action={updateEntry.bind(null, entry.id)}
          categories={options}
          initial={entry}
          href={feedHref(filter, view)}
          closeHref={viewHref}
        />
      );
    }
    // One entry opened like a note: the whole text, the menu, a way back.
    return (
      <article className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border dark:shadow-none">
        <div className="flex items-center gap-2">
          <span className={PILL}>{entryDateLabel(entry.occurredOn, entry.occurredTime, locale)}</span>
          <div className="ml-auto flex items-center">
            <EntryMenu
              id={entry.id}
              editHref={feedHref(filter, { mode: "edit", id: entry.id })}
              afterDelete={listHref}
            />
            <Link
              href={listHref}
              aria-label={t("backToFeed")}
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-sky hover:text-foreground"
            >
              <X className="size-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
        <p className="mt-4 font-serif text-[1.0625rem] leading-[1.6] whitespace-pre-wrap break-words">{entry.body}</p>
        <EntryCategories entry={entry} byId={byId} label={(c) => categoryLabel(c, tc)} />
      </article>
    );
  }

  const entries = await listEntries(filter);
  if (entries.length === 0) {
    const filtered = isFiltered(filter);
    return (
      <div className="mt-6 flex flex-col items-center gap-4 text-center">
        <p className="text-muted-foreground">{filtered ? t("emptyFiltered") : t("empty")}</p>
        {!filtered && (
          <Link href={feedHref(filter, { mode: "new" })} className={buttonVariants()}>
            {t("writeFirst")}
          </Link>
        )}
      </div>
    );
  }

  return (
    <section aria-label={t("title")}>
      <ol className="flex flex-col gap-3">
        {entries.map((entry) => (
          <li key={entry.id}>
            <article className="relative rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border transition-colors hover:ring-primary/40 dark:shadow-none">
              <div className="flex items-center gap-2">
                <span className={PILL}>{entryDateLabel(entry.occurredOn, entry.occurredTime, locale)}</span>
                <div className="ml-auto">
                  <EntryMenu
                    id={entry.id}
                    editHref={feedHref(filter, { mode: "edit", id: entry.id })}
                    afterDelete={listHref}
                  />
                </div>
              </div>
              <p className="mt-3 line-clamp-6 font-serif text-[1.0625rem] leading-[1.6] whitespace-pre-wrap break-words">
                {entry.body}
              </p>
              <EntryCategories entry={entry} byId={byId} label={(c) => categoryLabel(c, tc)} />
              {/* The whole card opens the entry; the menu above sits on top of this link. */}
              <Link
                href={feedHref(filter, { mode: "view", id: entry.id })}
                aria-label={t("openEntry")}
                className="absolute inset-0 rounded-2xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              />
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}

function EntryCategories({
  entry,
  byId,
  label,
}: {
  entry: Entry;
  byId: Map<string, Category>;
  label: (c: Category) => string;
}) {
  if (entry.categoryIds.length === 0) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-1.5">
      {entry.categoryIds.map((id) => {
        const c = byId.get(id);
        return c ? (
          <li key={id} className="rounded-full bg-sky px-2.5 py-0.5 text-xs">
            {label(c)}
          </li>
        ) : null;
      })}
    </ul>
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
