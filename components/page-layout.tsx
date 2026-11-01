import { cn } from "@/lib/utils";

/**
 * The one page layout (ADR-0004): a side column on the left and the main text
 * column, which starts at the same place on every screen whether or not the
 * page has a side column. Phones: head, then the side column, then the body.
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
        "grid gap-y-6 [grid-template-areas:'head'_'aside'_'body']",
        "md:grid-cols-[14rem_minmax(0,42rem)] md:grid-rows-[auto_1fr] md:justify-center md:gap-x-10",
        "md:[grid-template-areas:'aside_head'_'aside_body']",
      )}
    >
      {head && <div className="[grid-area:head]">{head}</div>}
      {aside ? (
        <aside aria-label={asideLabel} className="[grid-area:aside] md:sticky md:top-20 md:self-start">
          {aside}
        </aside>
      ) : (
        <div aria-hidden="true" className="hidden [grid-area:aside] md:block" />
      )}
      <div className="min-w-0 [grid-area:body]">{children}</div>
    </div>
  );
}
