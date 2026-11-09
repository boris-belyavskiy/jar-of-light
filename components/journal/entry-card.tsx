import Link from "next/link";
import { useTranslations } from "next-intl";
import { CategoryName } from "@/components/encryption/category-names";
import { EntryText } from "@/components/encryption/entry-text";
import { EntryMenu } from "@/components/journal/entry-menu";
import { PILL } from "@/components/journal/pill";
import { StarButton } from "@/components/journal/star-button";
import type { Category, Entry } from "@/lib/db/queries";
import { entryDateLabel } from "@/lib/time";

/**
 * One entry in the feed. Shared by the list the server renders and by the
 * results the device builds when it searches an encrypted account (ADR-0011),
 * so both look and behave the same.
 */
export function EntryCard({
  entry,
  byId,
  locale,
  viewHref,
  editHref,
  afterDelete,
}: {
  entry: Entry;
  byId: Map<string, Category>;
  locale: string;
  viewHref: string;
  editHref: string;
  afterDelete: string;
}) {
  const t = useTranslations("feed");
  return (
    <article className="relative rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border transition-colors hover:ring-primary/40 dark:shadow-none">
      <div className="flex items-center gap-2">
        <span className={PILL}>{entryDateLabel(entry.occurredOn, entry.occurredTime, locale)}</span>
        <div className="ml-auto flex items-center">
          <StarButton id={entry.id} starred={entry.starred} />
          <EntryMenu id={entry.id} editHref={editHref} afterDelete={afterDelete} />
        </div>
      </div>
      <EntryText
        entryId={entry.id}
        body={entry.body}
        bodyCipher={entry.bodyCipher}
        className="reading mt-3 line-clamp-6 whitespace-pre-wrap"
      />
      <EntryCategories entry={entry} byId={byId} />
      {/* The whole card opens the entry; the menu above sits on top of this link. */}
      <Link
        href={viewHref}
        scroll={false}
        aria-label={t("openEntry")}
        className="absolute inset-0 rounded-2xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      />
    </article>
  );
}

export function EntryCategories({ entry, byId }: { entry: Entry; byId: Map<string, Category> }) {
  if (entry.categoryIds.length === 0) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-1.5">
      {entry.categoryIds.map((id) => {
        const c = byId.get(id);
        return c ? (
          <li key={id} className="rounded-full bg-sky px-2.5 py-0.5 text-xs">
            <CategoryName category={c} />
          </li>
        ) : null;
      })}
    </ul>
  );
}
