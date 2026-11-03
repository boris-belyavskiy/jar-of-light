import Link from "next/link";
import { ChartColumn, Check, Star } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { buttonVariants, Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/db/queries";
import { feedHref, SEARCH_MAX_LENGTH, toggleCategory, type FeedFilter } from "@/lib/feed-filter";

const SECTION = "mt-3 border-t border-border pt-3";
const SECTION_TITLE = "text-xs font-bold text-foreground";
// Every button in the filter is the size of the sort options; phones get a bigger tap target.
const SMALL_BUTTON = "h-6 rounded-md px-1 text-xs max-md:h-8 [&_svg:not([class*='size-'])]:size-3.5";
const DATE_FIELD = "h-7 gap-1 px-1.5 text-xs whitespace-nowrap md:text-xs [&_svg]:size-3.5";

/**
 * The feed filters, in four parts: search by words, dates, favorites, categories. Rendered
 * twice — in the side column and, on phones, folded in the head — so ids get a
 * prefix. In the side column only the list of categories scrolls: everything
 * else keeps its place.
 */
export async function FeedFilters({
  prefix,
  filter,
  items,
  label,
  stats,
}: {
  prefix: string;
  filter: FeedFilter;
  items: Category[];
  label: (c: Category) => string;
  stats: boolean;
}) {
  const t = await getTranslations("feed");
  // Changing a filter keeps the user where they are: on the dashboard, or on the list.
  const view = stats ? ({ mode: "stats" } as const) : undefined;
  const hasSearch = Boolean(filter.q);
  const hasDates = Boolean(filter.from || filter.to);
  const hasCategories = filter.categoryIds.length > 0;

  return (
    <>
      {/* Plain GET forms: each carries the rest of the filter along in hidden fields. The key
          resets a form's fields when its filter is cleared, which a soft navigation would not. */}
      <form key={`q-${filter.q ?? ""}`} action="/app" className="mt-3 flex shrink-0 flex-col gap-1.5 md:mt-0">
        <KeptFields filter={filter} stats={stats} omit="search" />
        <Label htmlFor={`${prefix}q`} className={SECTION_TITLE}>
          {t("searchTitle")}
        </Label>
        <Input
          id={`${prefix}q`}
          type="search"
          name="q"
          defaultValue={filter.q}
          maxLength={SEARCH_MAX_LENGTH}
          placeholder={t("searchPlaceholder")}
          className="md:h-7 md:px-2 md:text-xs"
        />
        <FormButtons
          apply={t("searchApply")}
          clear={t("clear")}
          clearHref={hasSearch ? feedHref({ ...filter, q: undefined }, view) : undefined}
        />
      </form>

      <section className={cn(SECTION, "flex shrink-0 flex-col gap-1.5")}>
        <p className={SECTION_TITLE}>{t("datesTitle")}</p>
        <div role="group" aria-label={t("sortLabel")} className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
          <SortOption href={feedHref({ ...filter, sort: undefined }, view)} active={filter.sort !== "oldest"} label={t("newestFirst")} />
          <SortOption href={feedHref({ ...filter, sort: "oldest" }, view)} active={filter.sort === "oldest"} label={t("oldestFirst")} />
        </div>
        <form key={`dates-${filter.from ?? ""}-${filter.to ?? ""}`} action="/app" className="flex flex-col gap-1.5">
          <KeptFields filter={filter} stats={stats} omit="dates" />
          <div className="grid grid-cols-2 gap-2">
            <div className="flex min-w-0 flex-col gap-1">
              <Label htmlFor={`${prefix}from`} className="text-xs text-muted-foreground">
                {t("from")}
              </Label>
              <DatePicker id={`${prefix}from`} name="from" defaultValue={filter.from} clearable className={DATE_FIELD} />
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <Label htmlFor={`${prefix}to`} className="text-xs text-muted-foreground">
                {t("to")}
              </Label>
              <DatePicker id={`${prefix}to`} name="to" defaultValue={filter.to} clearable className={DATE_FIELD} />
            </div>
          </div>
          <FormButtons
            apply={t("applyDates")}
            clear={t("clear")}
            clearHref={hasDates ? feedHref({ ...filter, from: undefined, to: undefined }, view) : undefined}
          />
        </form>
      </section>

      <section className={cn(SECTION, "shrink-0")}>
        <FilterItem
          href={feedHref({ ...filter, starred: filter.starred ? undefined : true }, view)}
          active={Boolean(filter.starred)}
          label={t("favorites")}
          strong
          icon={<Star className={cn("size-3.5", filter.starred && "fill-light stroke-foreground/50")} aria-hidden="true" />}
        />
      </section>

      <nav aria-label={t("filterLabel")} className={cn(SECTION, "flex min-h-0 flex-col")}>
        <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
          <p className={SECTION_TITLE}>{t("categoriesTitle")}</p>
          {hasCategories ? (
            <Link
              href={feedHref({ ...filter, categoryIds: [] }, view)}
              className="text-xs text-primary underline-offset-4 hover:underline"
            >
              {t("clear")}
            </Link>
          ) : (
            <span className="text-xs text-muted-foreground/50">{t("clear")}</span>
          )}
        </div>
        {/* The list scrolls on its own when the categories don't fit. */}
        <ul className="flex min-h-24 flex-col gap-0.5 overflow-y-auto [scrollbar-width:thin] max-md:max-h-48">
          {items.map((c) => (
            <li key={c.id}>
              <FilterItem
                href={feedHref(toggleCategory(filter, c.id), view)}
                active={filter.categoryIds.includes(c.id)}
                label={label(c)}
              />
            </li>
          ))}
        </ul>
        {filter.categoryIds.length > 1 && <p className="mt-2 shrink-0 text-xs text-muted-foreground">{t("anyOf")}</p>}
        {filter.starred && hasCategories && (
          <p className="mt-2 shrink-0 text-xs text-muted-foreground">{t("favoritesAndCategories")}</p>
        )}
        <Link
          href="/app/categories"
          className="mt-2 inline-block shrink-0 text-xs text-primary underline-offset-4 hover:underline"
        >
          {t("editCategories")}
        </Link>
      </nav>
    </>
  );
}

/** The filter's other parts, so that submitting one form keeps them. */
function KeptFields({ filter, stats, omit }: { filter: FeedFilter; stats: boolean; omit: "search" | "dates" }) {
  return (
    <>
      {filter.categoryIds.map((id) => (
        <input key={id} type="hidden" name="category" value={id} />
      ))}
      {filter.sort === "oldest" && <input type="hidden" name="sort" value="oldest" />}
      {stats && <input type="hidden" name="stats" value="1" />}
      {filter.starred && <input type="hidden" name="starred" value="1" />}
      {omit !== "search" && filter.q && <input type="hidden" name="q" value={filter.q} />}
      {omit !== "dates" && filter.from && <input type="hidden" name="from" value={filter.from} />}
      {omit !== "dates" && filter.to && <input type="hidden" name="to" value={filter.to} />}
    </>
  );
}

/** "Show" and, beside it, "Clear", which stays in place but is off while there is nothing to clear. */
function FormButtons({ apply, clear, clearHref }: { apply: string; clear: string; clearHref?: string }) {
  return (
    <div className="mt-1 grid grid-cols-2 gap-2">
      <Button type="submit" variant="outline" className={SMALL_BUTTON}>
        {apply}
      </Button>
      {clearHref ? (
        <Link href={clearHref} className={cn(buttonVariants({ variant: "ghost" }), SMALL_BUTTON)}>
          {clear}
        </Link>
      ) : (
        <Button type="button" variant="ghost" disabled className={SMALL_BUTTON}>
          {clear}
        </Button>
      )}
    </div>
  );
}

/** Opens the dashboard, or goes back to the entries. Always on screen, under the filters. */
export async function StatsButton({ filter, stats, className }: { filter: FeedFilter; stats: boolean; className?: string }) {
  const t = await getTranslations("feed");
  return (
    <Link
      href={feedHref(filter, stats ? undefined : { mode: "stats" })}
      className={cn(buttonVariants({ variant: stats ? "secondary" : "outline" }), SMALL_BUTTON, className)}
    >
      <ChartColumn aria-hidden="true" />
      {stats ? t("backToFeed") : t("statsButton")}
    </Link>
  );
}

function SortOption({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex h-6 items-center justify-center rounded-md px-1 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none max-md:h-8",
        active ? "bg-card font-medium shadow-sm" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}

/** One row of the filter: a tick box and a name. The whole row is the tap target; several can be on at once. */
function FilterItem({
  href,
  active,
  label,
  icon,
  strong,
}: {
  href: string;
  active: boolean;
  label: string;
  icon?: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <Link
      href={href}
      role="checkbox"
      aria-checked={active}
      className={cn(
        "flex items-center gap-2 rounded-md py-1 pr-1 text-xs transition-colors hover:bg-sky focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset",
        active && "font-medium",
        strong && "font-bold",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-3.5 shrink-0 items-center justify-center rounded-[3px] border",
          active ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/50 bg-card",
        )}
      >
        {active && <Check className="size-2.5" strokeWidth={3.5} />}
      </span>
      <span className="min-w-0 flex-1 break-words">{label}</span>
      {icon}
    </Link>
  );
}
