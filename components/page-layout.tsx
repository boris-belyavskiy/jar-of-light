import { cn } from "@/lib/utils";

/**
 * The one page layout (ADR-0004), filling the fixed frame (ADR-0005) between the header
 * and the footer: an optional side column on the left and the main column,
 * which starts at the same place on every screen. The head (page title, the
 * feed's composer) and the side column stay put; only the body scrolls.
 * Phones: head, then the side column, then the body.
 */
export function PageLayout({
  head,
  aside,
  asideLabel,
  children,
}: {
  head?: React.ReactNode;
  aside?: React.ReactNode;
  asideLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid h-full grid-rows-[auto_auto_minmax(0,1fr)] gap-y-4 [grid-template-areas:'head'_'aside'_'body']",
        "md:grid-cols-[14rem_minmax(0,42rem)] md:grid-rows-[auto_minmax(0,1fr)] md:justify-center md:gap-x-10",
        "md:[grid-template-areas:'aside_head'_'aside_body']",
      )}
    >
      <div className="[grid-area:head]">{head}</div>
      {aside ? (
        <aside aria-label={asideLabel} className="min-h-0 [grid-area:aside] md:overflow-y-auto md:pb-6">
          {aside}
        </aside>
      ) : (
        <div aria-hidden="true" className="hidden [grid-area:aside] md:block" />
      )}
      {/* px/-mx keep card shadows from being cut off by the scroll box; pb leaves room for the "+". */}
      <div className="-mx-1 min-h-0 overflow-y-auto px-1 pb-24 [grid-area:body]">{children}</div>
    </div>
  );
}
