import Link from "next/link";
import { Check } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { buttonVariants, Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/db/queries";
import { feedHref, SEARCH_MAX_LENGTH, toggleCategory, type FeedFilter } from "@/lib/feed-filter";

/**
 * The feed filters. Rendered twice — in the side column and, on phones, folded
 * in the head — so ids get a prefix. In the side column only the list of
 * categories scrolls: everything else keeps its place.
 */
export async function FeedFilters({
  prefix,
  filter,
  items,
  label,
}: {
  prefix: string;
  filter: FeedFilter;
  items: Category[];
  label: (c: Category) => string;
}) {
  const t = await getTranslations("feed");
  const canReset = Boolean(filter.from || filter.to || filter.q);
  const hasCategories = filter.categoryIds.length > 0;

  return (
    <>
      {/* A plain GET form: the dates go into the URL next to the selected categories. */}
      <form action="/app" className="mt-3 grid shrink-0 grid-cols-2 gap-2 md:grid-cols-1">
        {filter.categoryIds.map((id) => (
          <input key={id} type="hidden" name="category" value={id} />
        ))}
        {filter.sort === "oldest" && <input type="hidden" name="sort" value="oldest" />}
        <div className="col-span-2 flex flex-col gap-1.5 md:col-span-1">
          <Label htmlFor={`${prefix}q`} className="text-xs text-muted-foreground">
            {t("searchLabel")}
          </Label>
          <Input
            id={`${prefix}q`}
            type="search"
            name="q"
            defaultValue={filter.q}
            maxLength={SEARCH_MAX_LENGTH}
            placeholder={t("searchPlaceholder")}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${prefix}from`} className="text-xs text-muted-foreground">
            {t("from")}
          </Label>
          <DatePicker id={`${prefix}from`} name="from" defaultValue={filter.from} clearable />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${prefix}to`} className="text-xs text-muted-foreground">
            {t("to")}
          </Label>
          <DatePicker id={`${prefix}to`} name="to" defaultValue={filter.to} clearable />
        </div>
        <div className="col-span-2 flex gap-2 md:col-span-1">
          <Button type="submit" variant="outline" className="flex-1 md:flex-none">
            {t("applyDates")}
          </Button>
          {canReset && (
            <Link
              href={feedHref({ ...filter, from: undefined, to: undefined, q: undefined })}
              className={buttonVariants({ variant: "ghost" })}
            >
              {t("resetSearchAndDates")}
            </Link>
          )}
        </div>
      </form>

      <div role="group" aria-label={t("sortLabel")} className="mt-3 grid shrink-0 grid-cols-2 gap-1 rounded-lg bg-muted p-1">
        <SortOption href={feedHref({ ...filter, sort: undefined })} active={filter.sort !== "oldest"} label={t("newestFirst")} />
        <SortOption href={feedHref({ ...filter, sort: "oldest" })} active={filter.sort === "oldest"} label={t("oldestFirst")} />
      </div>

      <nav aria-label={t("filterLabel")} className="mt-5 flex min-h-0 flex-col">
        <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">{t("categoriesTitle")}</p>
          {hasCategories ? (
            <Link
              href={feedHref({ ...filter, categoryIds: [] })}
              className="text-xs text-primary underline-offset-4 hover:underline"
            >
              {t("clearCategories")}
            </Link>
          ) : (
            <span className="text-xs text-muted-foreground/50">{t("clearCategories")}</span>
          )}
        </div>
        {/* The list scrolls on its own when the categories don't fit. */}
        <ul className="flex min-h-24 flex-col gap-0.5 overflow-y-auto [scrollbar-width:thin] max-md:max-h-48">
          {items.map((c) => (
            <li key={c.id}>
              <FilterItem
                href={feedHref(toggleCategory(filter, c.id))}
                active={filter.categoryIds.includes(c.id)}
                label={label(c)}
              />
            </li>
          ))}
        </ul>
        {filter.categoryIds.length > 1 && <p className="mt-2 shrink-0 text-xs text-muted-foreground">{t("anyOf")}</p>}
        <Link
          href="/app/categories"
          className="mt-3 inline-block shrink-0 text-sm text-primary underline-offset-4 hover:underline"
        >
          {t("editCategories")}
        </Link>
      </nav>
    </>
  );
}

function SortOption({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "rounded-md px-1 py-1 text-center text-xs transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        active ? "bg-card font-medium shadow-sm" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}

/** One row of the filter: a tick box and a name. The whole row is the tap target; several can be on at once. */
function FilterItem({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      role="checkbox"
      aria-checked={active}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-sky focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset",
        active && "font-medium",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded border",
          active ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/50 bg-card",
        )}
      >
        {active && <Check className="size-3" strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1 break-words">{label}</span>
    </Link>
  );
}
