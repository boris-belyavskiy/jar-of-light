import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { signOut } from "@/app/actions/account";
import { JarMark } from "@/components/jar-mark";
import { LanguageSwitch } from "@/components/language-switch";
import { Button, buttonVariants } from "@/components/ui/button";
import { requireUserId } from "@/lib/db/queries";

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  await requireUserId();
  const t = await getTranslations("nav");
  const tm = await getTranslations("meta");

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-2xl items-center gap-2 px-4">
          <Link href="/app" className="mr-auto flex items-center gap-2 text-primary">
            <JarMark className="size-7" />
            <span className="hidden font-heading text-lg font-semibold text-foreground sm:inline">{tm("title")}</span>
          </Link>
          <LanguageSwitch />
          <nav className="flex items-center text-sm sm:gap-1">
            <Link href="/app/categories" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              {t("categories")}
            </Link>
            <Link href="/app/settings" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              {t("settings")}
            </Link>
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm">
                {t("signOut")}
              </Button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-6 pb-28">{children}</main>
    </div>
  );
}
