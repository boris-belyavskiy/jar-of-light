import { getTranslations } from "next-intl/server";
import { monthLabel } from "@/components/journal/month-label";
import { cn } from "@/lib/utils";
import type { CategoryCount, DateSeries } from "@/lib/dashboard-stats";
import type { Category } from "@/lib/db/queries";
import { displayDate } from "@/lib/time";

const CARD = "rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border dark:shadow-none";

/**
 * Bars for one series, in the "primary" colour: the gold of the lights is too
 * faint against the card (1.6:1) for a mark that has to be read. Hovering or
 * tapping a bar names its date and count; a hidden table repeats the data for
 * screen readers.
 */
export async function EntriesByDateChart({ series, locale }: { series: DateSeries; locale: string }) {
  const t = await getTranslations("stats");
  const title = series.unit === "day" ? t("byDateTitle") : t("byMonthTitle");
  const name = (key: string) => (series.unit === "day" ? displayDate(key, locale) : monthLabel(key, locale));
  const max = Math.max(...series.points.map((p) => p.count));
  const last = series.points.length - 1;

  return (
    <figure className={CARD}>
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="font-heading font-semibold">{title}</span>
        <span className="text-xs text-muted-foreground">{t("chartMax", { count: max })}</span>
      </figcaption>
      <div aria-hidden="true" className="mt-8 flex h-36 items-end gap-0.5 border-b border-border">
        {series.points.map((point, i) => (
          <div
            key={point.key}
            tabIndex={point.count > 0 ? 0 : undefined}
            className="group relative flex h-full min-w-0 flex-1 items-end outline-none"
          >
            {point.count > 0 && (
              <div
                className="w-full rounded-t bg-primary transition-opacity group-hover:opacity-80 group-focus:opacity-80"
                style={{ height: `${(point.count / max) * 100}%` }}
              />
            )}
            {/* Near the edges the label grows inwards, so it stays inside the card. */}
            <span
              className={cn(
                "pointer-events-none absolute bottom-full z-10 mb-1 hidden rounded-md bg-foreground px-2 py-1 text-xs whitespace-nowrap text-background group-hover:block group-focus:block",
                i < last / 3 ? "left-0" : i > (2 * last) / 3 ? "right-0" : "left-1/2 -translate-x-1/2",
              )}
            >
              {name(point.key)}: {point.count}
            </span>
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="mt-1.5 flex justify-between gap-2 text-xs text-muted-foreground">
        <span>{name(series.points[0].key)}</span>
        {last > 0 && <span>{name(series.points[last].key)}</span>}
      </div>
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">{t("dateColumn")}</th>
            <th scope="col">{t("countColumn")}</th>
          </tr>
        </thead>
        <tbody>
          {series.points
            .filter((p) => p.count > 0)
            .map((p) => (
              <tr key={p.key}>
                <td>{name(p.key)}</td>
                <td>{p.count}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </figure>
  );
}

/** How the entries spread across categories: one labelled bar per category. */
export async function EntriesByCategoryChart({
  counts,
  categories,
  label,
}: {
  counts: CategoryCount[];
  categories: Category[];
  label: (c: Category) => React.ReactNode;
}) {
  const t = await getTranslations("stats");
  const byId = new Map(categories.map((c) => [c.id, c]));
  const rows = counts.flatMap(({ categoryId, count }) => {
    if (categoryId === null) return [{ key: "none", name: t("noCategory"), count }];
    const category = byId.get(categoryId);
    return category ? [{ key: categoryId, name: label(category), count }] : [];
  });
  const max = Math.max(...rows.map((r) => r.count));

  return (
    <figure className={CARD}>
      <figcaption className="font-heading font-semibold">{t("byCategoryTitle")}</figcaption>
      <dl className="mt-4 flex flex-col gap-3">
        {rows.map((row) => (
          <div key={row.key}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <dt className="min-w-0 break-words">{row.name}</dt>
              <dd className="shrink-0 font-medium tabular-nums">{row.count}</dd>
            </div>
            <div aria-hidden="true" className="mt-1 h-2 rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(row.count / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-xs text-muted-foreground">{t("doubleCountNote")}</p>
    </figure>
  );
}
