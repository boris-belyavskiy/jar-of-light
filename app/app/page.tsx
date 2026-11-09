import Link from "next/link";
import { X } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { createEntry, updateEntry } from "@/app/actions/entries";
import { EditEntry } from "@/components/encryption/edit-entry";
import { DeviceFeed, DeviceStats } from "@/components/encryption/feed-search";
import { EntryText } from "@/components/encryption/entry-text";
import { WriteGate } from "@/components/encryption/write-gate";
import { EntryCard, EntryCategories } from "@/components/journal/entry-card";
import { EntryForm } from "@/components/journal/entry-form";
import { EntryMenu } from "@/components/journal/entry-menu";
import { EntryOverlay } from "@/components/journal/entry-overlay";
import { FeedFilters, StatsButton } from "@/components/journal/feed-filters";
import { FilterPanel } from "@/components/journal/filter-panel";
import { PILL } from "@/components/journal/pill";
import { StarButton } from "@/components/journal/star-button";
import { StatsView } from "@/components/journal/stats-view";
import { JarMark } from "@/components/jar-mark";
import { PageLayout } from "@/components/page-layout";
import { buttonVariants } from "@/components/ui/button";
import {
  getEntry,
  getKeyRecord,
  getProfile,
  listCategories,
  listEntries,
  listStatEntries,
  type Category,
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
 *
 * An account with encryption keys is searched by the device, not the server
 * (ADR-0011, ADR-0013): its search words never come in the address, and an old
 * link with `q` is ignored. The server list and statistics are what shows until
 * the person searches.
 */
export default async function FeedPage({ searchParams }: PageProps<"/app">) {
  const params = await searchParams;
  const keyed = (await getKeyRecord()) !== null;
  const parsed = parseFeedFilter(params);
  const filter: FeedFilter = keyed ? { ...parsed, q: undefined } : parsed;
  const view = parseFeedView(params);
  const filtered = isFiltered(filter);
  const stats = view.mode === "stats";

  const [categories, t, locale] = await Promise.all([listCategories(), getTranslations("feed"), getLocale()]);
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

  const filters = (prefix: string) => (
    <FeedFilters prefix={prefix} filter={filter} items={items} stats={stats} deviceSearch={keyed} />
  );

  return (
    <PageLayout
      head={head}
      aside={
        <>
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
        <StatsPane filter={filter} categories={categories} locale={locale} keyed={keyed} />
      ) : (
        <>
          {keyed ? (
            <DeviceFeed filter={filter} categories={categories} locale={locale}>
              <EntryList filter={filter} categories={categories} locale={locale} />
            </DeviceFeed>
          ) : (
            <EntryList filter={filter} categories={categories} locale={locale} />
          )}
          {view.mode !== "list" && <OpenedEntry view={view} filter={filter} categories={categories} locale={locale} />}
        </>
      )}
    </PageLayout>
  );
}

async function StatsPane({
  filter,
  categories,
  locale,
  keyed,
}: {
  filter: FeedFilter;
  categories: Category[];
  locale: string;
  keyed: boolean;
}) {
  const view = <StatsView entries={await listStatEntries(filter)} filter={filter} categories={categories} locale={locale} />;
  return keyed ? (
    <DeviceStats filter={filter} categories={categories} locale={locale}>
      {view}
    </DeviceStats>
  ) : (
    view
  );
}

async function NewEntry({ filter, categories }: { filter: FeedFilter; categories: Category[] }) {
  const profile = await getProfile();
  // "Now" by default, in the user's time zone rather than the server's (ACC-04).
  const now = nowInTimeZone(profile.timezone);
  return (
    <WriteGate closeHref={feedHref(filter)}>
      <EntryForm
        action={createEntry}
        categories={categories.filter((c) => !c.hidden)}
        initial={{ body: "", occurredOn: now.date, occurredTime: now.time, categoryIds: [] }}
        href={feedHref(filter, { mode: "new" })}
        closeHref={feedHref(filter)}
      />
    </WriteGate>
  );
}

async function EntryList({
  filter,
  categories,
  locale,
}: {
  filter: FeedFilter;
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
            <EntryCard
              entry={entry}
              byId={byId}
              locale={locale}
              viewHref={feedHref(filter, { mode: "view", id: entry.id })}
              editHref={feedHref(filter, { mode: "edit", id: entry.id })}
              afterDelete={feedHref(filter)}
            />
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
  locale,
}: {
  view: Extract<FeedView, { id: string }>;
  filter: FeedFilter;
  categories: Category[];
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
        <EditEntry
          action={updateEntry.bind(null, entry.id)}
          categories={options}
          entry={entry}
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
            <StarButton id={entry.id} starred={entry.starred} />
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
        <EntryText
          entryId={entry.id}
          body={entry.body}
          bodyCipher={entry.bodyCipher}
          className="reading mt-4 whitespace-pre-wrap"
        />
        <EntryCategories entry={entry} byId={byId} />
      </article>
    </EntryOverlay>
  );
}
