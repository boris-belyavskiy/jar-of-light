import { cn } from "@/lib/utils";

/**
 * The one page layout (ADR-0004, ADR-0006). The window scrolls; the head (page
 * title, the feed's composer) sticks under the header and the side column
 * sticks beside it, so only the body moves.
 *
 * Widths: without a side column the page uses the full width of the frame —
 * from the logo on the left to sign-out on the right. With one (the feed), the
 * side column starts at that same left edge and the body is a reading column.
 *
 * Phones have no room for a side column, so `asideInHead` is shown inside the
 * sticky head instead (the feed passes its filters there, folded).
 */
export function PageLayout({
  head,
  aside,
  asideInHead,
  asideLabel,
  children,
}: {
  head?: React.ReactNode;
  aside?: React.ReactNode;
  asideInHead?: React.ReactNode;
  asideLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid [grid-template-areas:'head'_'body']",
        aside &&
          "md:grid-cols-[14rem_minmax(0,42rem)] md:grid-rows-[auto_1fr] md:gap-x-10 md:[grid-template-areas:'aside_head'_'aside_body']",
      )}
    >
      {/* Wider than the column by 0.5rem each side, so the cards' outline and shadow can't show past it while scrolling. */}
      <div className="sticky top-14 z-20 -mx-2 bg-background px-2 pt-6 pb-4 [grid-area:head]">
        {head}
        {asideInHead && <div className="mt-4 md:hidden">{asideInHead}</div>}
      </div>
      {aside && (
        <aside
          aria-label={asideLabel}
          className="sticky top-14 hidden max-h-[calc(100dvh-6.5rem)] self-start overflow-y-auto pt-6 pb-6 [grid-area:aside] md:flex md:flex-col"
        >
          {aside}
        </aside>
      )}
      {/* pb leaves room for the "+" in the corner. */}
      <div className="min-w-0 pb-24 [grid-area:body]">{children}</div>
    </div>
  );
}
