import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { JarMark } from "@/components/jar-mark";

/** The header frame shared by the signed-in and signed-out shells (ADR-0004). */
export async function SiteHeader({
  logoHref,
  logoLabel,
  children,
}: {
  logoHref: string;
  logoLabel: string;
  children: React.ReactNode;
}) {
  const tm = await getTranslations("meta");
  return (
    <header className="sticky top-0 z-30 h-14 shrink-0 border-b bg-background">
      <div className="mx-auto flex h-full w-full max-w-5xl items-center gap-2 px-4">
        <Link href={logoHref} aria-label={logoLabel} className="mr-auto -ml-[5.25px] flex items-center gap-2 text-primary">
          <JarMark className="size-7" />
          <span className="hidden font-heading text-lg font-semibold text-foreground lg:inline">{tm("title")}</span>
        </Link>
        {children}
      </div>
    </header>
  );
}
