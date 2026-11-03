import { cn } from "@/lib/utils";

/**
 * The one page layout (ADR-0004, ADR-0006). The window scrolls; the head (page
 * title, the feed's composer) sticks under the header and the side column
 * sticks beside it, so only the body moves.
 *
 * Widths (ADR-0008): every page uses the full width of the frame, from the left
 * edge of the jar in the logo to the right edge of the words "Sign out". With a
 * side column (the feed), it starts at that same left edge and the body runs to
 * that same right edge. The first line of the side column shares its baseline
 * with the page title.
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
          "md:grid-cols-[14rem_minmax(0,1fr)] md:grid-rows-[auto_1fr] md:gap-x-10 md:[grid-template-areas:'aside_head'_'aside_body']",
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
          className="sticky top-14 hidden max-h-[calc(100dvh-6.5rem)] self-start overflow-y-auto pt-[40.5px] pb-6 [grid-area:aside] md:flex md:flex-col"
        >
          {aside}
        </aside>
      )}
      {/* pb leaves room for the "+" in the corner. */}
      <div className="min-w-0 pb-24 [grid-area:body]">{children}</div>
    </div>
  );
}
