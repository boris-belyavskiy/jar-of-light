import Link from "next/link";
import { LogOut, Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { signOut } from "@/app/actions/account";
import { LanguageSwitch } from "@/components/language-switch";
import { NavTabs } from "@/components/nav-tabs";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

/**
 * Everything a signed-in user sees around a page: the header with tabs, the
 * language switch and sign-out, and the "+" for a new entry. Used by /app and
 * by the public pages (/about, /privacy) when the visitor is signed in.
 */
export async function AppShell({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("nav");

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader logoHref="/app" logoLabel={t("feed")}>
        <NavTabs />
        <LanguageSwitch />
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm" aria-label={t("signOut")} className="text-muted-foreground">
            <LogOut aria-hidden="true" />
            <span className="hidden md:inline">{t("signOut")}</span>
          </Button>
        </form>
      </SiteHeader>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4">{children}</main>
      <Link
        href="/app?new=1"
        aria-label={t("newEntry")}
        className="fixed right-5 bottom-16 z-20 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-light/40 transition-transform hover:scale-105"
      >
        <Plus className="size-6" strokeWidth={1.75} />
      </Link>
    </div>
  );
}
