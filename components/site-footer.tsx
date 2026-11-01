import Link from "next/link";
import { getTranslations } from "next-intl/server";

/** The same two links at the bottom of every screen, signed in or not. */
export async function SiteFooter() {
  const t = await getTranslations("nav");
  return (
    <footer className="mx-auto flex w-full max-w-5xl gap-4 px-4 py-5 text-sm">
      <Link href="/about" className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
        {t("about")}
      </Link>
      <Link href="/privacy" className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
        {t("privacy")}
      </Link>
    </footer>
  );
}
