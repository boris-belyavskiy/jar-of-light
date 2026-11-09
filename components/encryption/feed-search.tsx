"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { fetchEntryRows } from "@/app/actions/search";
import { EntryCard } from "@/components/journal/entry-card";
import { StatsView } from "@/components/journal/stats-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Category, Entry } from "@/lib/db/queries";
import { feedHref, SEARCH_MAX_LENGTH, type FeedFilter } from "@/lib/feed-filter";
import { filterKey, matchesQuery, SEARCH_RESULT_LIMIT } from "@/lib/feed-search";
import { useKeys } from "./key-provider";
import { UnlockForm } from "./unlock-form";

/**
 * Search by words for an account with encryption keys (ADR-0011, ADR-0013). The
 * server holds only ciphertext, so the device fetches the entries the category,
 * date and favorites filters select, decrypts them, and matches the words
 * itself. The words live only in this tab's memory: not in the address, not in
 * a request, not in any log.
 */

const SearchContext = createContext<{ q: string; setQ(value: string): void }>({ q: "", setQ: () => {} });

export function FeedSearchProvider({ children }: { children: ReactNode }) {
  const [q, setQ] = useState("");
  const value = useMemo(() => ({ q, setQ }), [q]);
  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

const SECTION_TITLE = "text-xs font-bold text-foreground";
const SMALL_BUTTON = "h-6 rounded-md px-1 text-xs max-md:h-8";

/** The search field in the filter column, shown in place of the server's search form. */
export function DeviceSearchBox({ prefix }: { prefix: string }) {
  const t = useTranslations("feed");
  const { q, setQ } = useContext(SearchContext);
  const [text, setText] = useState(q);
  const [seen, setSeen] = useState(q);
  // Another box (the filter is shown twice) or "Clear" changed the words: follow them.
  if (q !== seen) {
    setSeen(q);
    setText(q);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setQ(text.trim());
      }}
      className="mt-3 flex shrink-0 flex-col gap-1.5 md:mt-0"
    >
      <Label htmlFor={`${prefix}q`} className={SECTION_TITLE}>
        {t("searchTitle")}
      </Label>
      <Input
        id={`${prefix}q`}
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={SEARCH_MAX_LENGTH}
        placeholder={t("searchPlaceholder")}
        autoComplete="off"
        className="md:h-7 md:px-2 md:text-xs"
      />
      <div className="mt-1 grid grid-cols-2 gap-2">
        <Button type="submit" variant="outline" className={SMALL_BUTTON}>
          {t("searchApply")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={!q && !text}
          onClick={() => {
            setText("");
            setQ("");
          }}
          className={SMALL_BUTTON}
        >
          {t("clear")}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{t("deviceSearchNote")}</p>
    </form>
  );
}

/** Fetches one page of rows. The real one is a server action; a stand-in can replace it in a harness. */
export type FetchRows = (filter: FeedFilter, start: number) => Promise<{ rows: Entry[]; done: boolean }>;

type Loaded = { rows: Entry[]; texts: Map<string, string | null>; loading: boolean; failed: boolean };
const EMPTY: Loaded = { rows: [], texts: new Map(), loading: false, failed: false };

/**
 * Every entry the filter selects, fetched page by page and decrypted as it
 * arrives. Starts only while `active`; starts over when the filter, the key or
 * `refresh` changes. Failed decryptions are kept as unreadable, never as text.
 */
function useEntryRows(filter: FeedFilter, active: boolean, refresh: number, fetchRows: FetchRows): Loaded {
  const { status, decrypt } = useKeys();
  const unlocked = status === "unlocked";
  const decryptRef = useRef(decrypt);
  useEffect(() => {
    decryptRef.current = decrypt;
  });
  const [loaded, setLoaded] = useState<Loaded>(EMPTY);
  const key = filterKey(filter);
  const filterRef = useRef(filter);
  const fetchRef = useRef(fetchRows);
  useEffect(() => {
    filterRef.current = filter;
    fetchRef.current = fetchRows;
  });

  useEffect(() => {
    if (!active || status === "loading") return;
    let cancelled = false;
    (async () => {
      const rows: Entry[] = [];
      const texts = new Map<string, string | null>();
      // Keep what is on screen while a fresh copy arrives, so a refresh does not flash.
      setLoaded((previous) => ({ ...previous, loading: true, failed: false }));
      try {
        for (let start = 0; ; start += 500) {
          const page = await fetchRef.current(filterRef.current, start);
          if (cancelled) return;
          for (const row of page.rows) {
            rows.push(row);
            if (row.body !== null) texts.set(row.id, row.body);
            else if (row.bodyCipher && unlocked) {
              try {
                texts.set(row.id, await decryptRef.current({ table: "entries", rowId: row.id, field: "body" }, row.bodyCipher));
              } catch {
                texts.set(row.id, null); // changed or from another key: it matches nothing, and nothing is logged
              }
            } else texts.set(row.id, null);
          }
          if (cancelled) return;
          setLoaded({ rows: [...rows], texts: new Map(texts), loading: !page.done, failed: false });
          if (page.done) return;
        }
      } catch {
        if (!cancelled) setLoaded((previous) => ({ ...previous, loading: false, failed: true }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active, key, unlocked, status, refresh]);

  return active ? loaded : EMPTY;
}

/** Counts a return to the list, so results are fetched again after an entry was edited, added or deleted. */
function useRefreshOnReturn(): number {
  const params = useSearchParams();
  const open = params.has("entry") || params.has("new");
  const [count, setCount] = useState(0);
  const was = useRef(open);
  useEffect(() => {
    if (was.current && !open) setCount((n) => n + 1);
    was.current = open;
  }, [open]);
  return count;
}

function LockedNotice() {
  const t = useTranslations("feed");
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border dark:shadow-none">
      <div>
        <h2 className="font-heading text-lg font-semibold">{t("searchLockedTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("searchLockedBody")}</p>
      </div>
      <UnlockForm />
    </div>
  );
}

function Searching() {
  const t = useTranslations("feed");
  return <p className="mt-6 text-center text-sm text-muted-foreground">{t("searching")}</p>;
}

/**
 * The feed. Without search words it shows what the server rendered (`children`);
 * with words it shows the matches the device found, drawn with the same cards.
 */
export function DeviceFeed({
  filter,
  categories,
  locale,
  fetchRows = fetchEntryRows,
  children,
}: {
  filter: FeedFilter;
  categories: Category[];
  locale: string;
  fetchRows?: FetchRows;
  children: ReactNode;
}) {
  const t = useTranslations("feed");
  const { q } = useContext(SearchContext);
  const { status } = useKeys();
  const refresh = useRefreshOnReturn();
  const searching = q.trim().length > 0;
  const loaded = useEntryRows(filter, searching, refresh, fetchRows);

  const matches = useMemo(
    () => loaded.rows.filter((row) => matchesQuery(loaded.texts.get(row.id) ?? null, q)),
    [loaded.rows, loaded.texts, q],
  );

  if (!searching) return <>{children}</>;
  if (status === "locked") return <LockedNotice />;
  if (status === "loading" || (loaded.rows.length === 0 && loaded.loading)) return <Searching />;
  if (loaded.failed && loaded.rows.length === 0) {
    return <p className="mt-6 text-center text-muted-foreground">{t("searchFailed")}</p>;
  }

  const byId = new Map(categories.map((c) => [c.id, c]));
  const shown = matches.slice(0, SEARCH_RESULT_LIMIT);
  return (
    <section aria-label={t("title")}>
      <p className="mb-3 flex flex-wrap items-baseline gap-x-3 text-sm text-muted-foreground" aria-live="polite">
        <span>{t("searchResults", { count: matches.length })}</span>
        {loaded.loading && <span>{t("searching")}</span>}
        {matches.length > shown.length && <span>{t("searchFirst", { count: shown.length })}</span>}
      </p>
      {shown.length === 0 ? (
        !loaded.loading && <p className="mt-6 text-center text-muted-foreground">{t("emptyFiltered")}</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {shown.map((entry) => (
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
      )}
    </section>
  );
}

/**
 * The statistics page. Without search words it shows what the server computed;
 * with words it counts only the entries the device found.
 */
export function DeviceStats({
  filter,
  categories,
  locale,
  fetchRows = fetchEntryRows,
  children,
}: {
  filter: FeedFilter;
  categories: Category[];
  locale: string;
  fetchRows?: FetchRows;
  children: ReactNode;
}) {
  const t = useTranslations("feed");
  const { q, setQ } = useContext(SearchContext);
  const { status } = useKeys();
  const searching = q.trim().length > 0;
  const loaded = useEntryRows(filter, searching, 0, fetchRows);

  const entries = useMemo(
    () =>
      loaded.rows
        .filter((row) => matchesQuery(loaded.texts.get(row.id) ?? null, q))
        .map((row) => ({ occurredOn: row.occurredOn, categoryIds: row.categoryIds })),
    [loaded.rows, loaded.texts, q],
  );

  if (!searching) return <>{children}</>;
  if (status === "locked") return <LockedNotice />;
  if (status === "loading" || loaded.loading) return <Searching />;
  if (loaded.failed) return <p className="mt-6 text-center text-muted-foreground">{t("searchFailed")}</p>;

  return (
    <div className="flex flex-col gap-4">
      <p className="flex flex-wrap items-baseline gap-x-3 text-sm text-muted-foreground">
        <span>{t("statsForSearch", { count: entries.length })}</span>
        <button type="button" onClick={() => setQ("")} className="text-primary underline-offset-4 hover:underline">
          {t("clear")}
        </button>
      </p>
      <StatsView entries={entries} filter={filter} categories={categories} locale={locale} />
    </div>
  );
}
