import { getTranslations } from "next-intl/server";
import { EntriesByDateChart } from "@/components/journal/stats-charts";
import { monthLabel } from "@/components/journal/month-label";
import { entriesByDate, summaryStats, type StatEntry } from "@/lib/dashboard-stats";
import type { FeedFilter } from "@/lib/feed-filter";
import { displayDate } from "@/lib/time";

/** The dashboard: what the entries selected by the filter add up to, in the feed's column. */
export async function StatsView({
  entries,
  filter,
  locale,
}: {
  entries: StatEntry[];
  filter: FeedFilter;
  locale: string;
}) {
  const t = await getTranslations("stats");
  const period =
    filter.from && filter.to
      ? t("periodRange", { from: displayDate(filter.from, locale), to: displayDate(filter.to, locale) })
      : filter.from
        ? t("periodFrom", { from: displayDate(filter.from, locale) })
        : filter.to
          ? t("periodTo", { to: displayDate(filter.to, locale) })
          : t("periodAll");

  if (entries.length === 0) {
    return (
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">{period}</p>
        <p className="mt-2 text-muted-foreground">{t("empty")}</p>
      </div>
    );
  }

  const stats = summaryStats(entries);
  return (
    <section aria-label={t("title")} className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{period}</p>
      <dl className="grid gap-3 sm:grid-cols-3">
        <StatTile label={t("total")} value={String(stats.total)} />
        <StatTile label={t("activeDays")} value={String(stats.activeDays)} />
        {stats.bestMonth && (
          <StatTile
            label={t("bestMonth")}
            value={monthLabel(stats.bestMonth.month, locale)}
            note={t("entriesCount", { count: stats.bestMonth.count })}
            small
          />
        )}
      </dl>
      <EntriesByDateChart series={entriesByDate(entries, filter)} locale={locale} />
    </section>
  );
}

function StatTile({ label, value, note, small }: { label: string; value: string; note?: string; small?: boolean }) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border dark:shadow-none">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={small ? "mt-1 font-heading text-xl font-semibold" : "mt-1 font-heading text-3xl font-semibold"}>
        {value}
      </dd>
      {note && <dd className="text-sm text-muted-foreground">{note}</dd>}
    </div>
  );
}
