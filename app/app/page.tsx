import Link from "next/link";
import { X } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { createEntry, updateEntry } from "@/app/actions/entries";
import { categoryLabel } from "@/components/journal/category-label";
import { EntryForm } from "@/components/journal/entry-form";
import { EntryMenu } from "@/components/journal/entry-menu";
import { EntryOverlay } from "@/components/journal/entry-overlay";
import { FeedFilters, StatsButton } from "@/components/journal/feed-filters";
import { FilterPanel } from "@/components/journal/filter-panel";
import { PILL } from "@/components/journal/pill";
import { StatsView } from "@/components/journal/stats-view";
import { JarMark } from "@/components/jar-mark";
import { PageLayout } from "@/components/page-layout";
import { buttonVariants } from "@/components/ui/button";
import {
  getEntry,
  getProfile,
  listCategories,
  listEntries,
  listStatEntries,
  type Category,
  type Entry,
} from "@/lib/db/queries";
import {
  feedHref,
  isFiltered,
  parseFeedFilter,
  parseFeedView,
  type FeedFilter,
  type FeedView,
} from "@/lib/feed-filter";
import { entryDateLabel, nowInTimeZone } from "@/lib/time";

/**
 * The journal (ADR-0005, ADR-0006). The composer bar expands in place into a
 * new entry; an entry opens as a window over the feed, as wide as the frame,
 * and "Edit" turns that window into the form. The title, composer and filters
 * stick in place; only the entries scroll.
 */
export default async function FeedPage({ searchParams }: PageProps<"/app">) {
  const params = await searchParams;
  const filter = parseFeedFilter(params);
  const view = parseFeedView(params);
  const filtered = isFiltered(filter);
  const stats = view.mode === "stats";

  const [categories, t, tc, locale] = await Promise.all([
    listCategories(),
    getTranslations("feed"),
    getTranslations("categories"),
    getLocale(),
  ]);
  const label = (c: Category) => categoryLabel(c, tc, locale);
  const items = categories.filter((c) => !c.hidden || filter.categoryIds.includes(c.id));

  const head = (
    <>
      <h1 className="font-heading text-2xl font-semibold">{stats ? t("statsTitle") : t("title")}</h1>
      {/* While writing, the composer has expanded into the card below. */}
      {view.mode !== "new" && (
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

  const filters = (prefix: string) => <FeedFilters prefix={prefix} filter={filter} items={items} label={label} stats={stats} />;

  return (
    <PageLayout
      head={head}
      aside={
        <>
          <h2 className="shrink-0 text-sm font-semibold">{t("filtersTitle")}</h2>
          {filters("side-")}
          {/* Stays on screen: only the category list above it gives way when space runs out. */}
          <StatsButton filter={filter} stats={stats} className="sticky bottom-0 mt-3 w-full shrink-0" />
        </>
      }
      asideInHead={
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <FilterPanel title={t("filtersTitle")} active={filtered}>
              {filters("head-")}
            </FilterPanel>
          </div>
          <StatsButton filter={filter} stats={stats} className="shrink-0" />
        </div>
      }
      asideLabel={t("filtersTitle")}
    >
      {view.mode === "new" ? (
        <NewEntry filter={filter} categories={categories} />
      ) : stats ? (
        <StatsView
          entries={await listStatEntries(filter)}
          filter={filter}
          categories={categories}
          label={label}
          locale={locale}
        />
      ) : (
        <>
          <EntryList filter={filter} label={label} categories={categories} locale={locale} />
          {view.mode !== "list" && (
            <OpenedEntry view={view} filter={filter} categories={categories} label={label} locale={locale} />
          )}
        </>
      )}
    </PageLayout>
  );
}

async function NewEntry({ filter, categories }: { filter: FeedFilter; categories: Category[] }) {
  const profile = await getProfile();
  // "Now" by default, in the user's time zone rather than the server's (ACC-04).
  const now = nowInTimeZone(profile.timezone);
  return (
    <EntryForm
      action={createEntry}
      categories={categories.filter((c) => !c.hidden)}
      initial={{ body: "", occurredOn: now.date, occurredTime: now.time, categoryIds: [] }}
      href={feedHref(filter, { mode: "new" })}
      closeHref={feedHref(filter)}
    />
  );
}

async function EntryList({
  filter,
  label,
  categories,
  locale,
}: {
  filter: FeedFilter;
  label: (c: Category) => string;
  categories: Category[];
  locale: string;
}) {
  const t = await getTranslations("feed");
  const entries = await listEntries(filter);
  const byId = new Map(categories.map((c) => [c.id, c]));

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
                    afterDelete={feedHref(filter)}
                  />
                </div>
              </div>
              <p className="mt-3 line-clamp-6 font-serif text-[1.0625rem] leading-[1.6] whitespace-pre-wrap break-words">
                {entry.body}
              </p>
              <EntryCategories entry={entry} byId={byId} label={label} />
              {/* The whole card opens the entry; the menu above sits on top of this link. */}
              <Link
                href={feedHref(filter, { mode: "view", id: entry.id })}
                scroll={false}
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

/** One entry as a window over the feed: read like a note, or edit in the same window. */
async function OpenedEntry({
  view,
  filter,
  categories,
  label,
  locale,
}: {
  view: Extract<FeedView, { id: string }>;
  filter: FeedFilter;
  categories: Category[];
  label: (c: Category) => string;
  locale: string;
}) {
  const t = await getTranslations("feed");
  const te = await getTranslations("entry");
  const listHref = feedHref(filter);
  const entry = await getEntry(view.id);

  if (!entry) {
    return (
      <EntryOverlay closeHref={listHref} label={te("notFound")}>
        <div className="flex h-full flex-col items-center justify-center gap-4 bg-card text-center">
          <p className="text-muted-foreground">{te("notFound")}</p>
          <Link href={listHref} scroll={false} className="text-primary underline-offset-4 hover:underline">
            ← {t("backToFeed")}
          </Link>
        </div>
      </EntryOverlay>
    );
  }

  const viewHref = feedHref(filter, { mode: "view", id: entry.id });
  if (view.mode === "edit") {
    // Hidden categories stay selectable on entries that already use them.
    const options = categories.filter((c) => !c.hidden || entry.categoryIds.includes(c.id));
    return (
      <EntryOverlay closeHref={viewHref} label={te("edit")}>
        <EntryForm
          action={updateEntry.bind(null, entry.id)}
          categories={options}
          initial={entry}
          href={feedHref(filter, view)}
          closeHref={viewHref}
        />
      </EntryOverlay>
    );
  }

  const byId = new Map(categories.map((c) => [c.id, c]));
  return (
    <EntryOverlay closeHref={listHref} label={entryDateLabel(entry.occurredOn, entry.occurredTime, locale)}>
      <article className="min-h-full rounded-2xl bg-card p-5 shadow-lg ring-1 ring-border">
        <div className="flex items-center gap-2">
          <span className={PILL}>{entryDateLabel(entry.occurredOn, entry.occurredTime, locale)}</span>
          <div className="ml-auto flex items-center">
            <EntryMenu id={entry.id} editHref={feedHref(filter, { mode: "edit", id: entry.id })} afterDelete={listHref} />
            <Link
              href={listHref}
              scroll={false}
              aria-label={t("backToFeed")}
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-sky hover:text-foreground"
            >
              <X className="size-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
        <p className="mt-4 font-serif text-[1.125rem] leading-[1.65] whitespace-pre-wrap break-words">{entry.body}</p>
        <EntryCategories entry={entry} byId={byId} label={label} />
      </article>
    </EntryOverlay>
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
