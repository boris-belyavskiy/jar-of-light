import { getTranslations } from "next-intl/server";
import { LanguageSwitch } from "@/components/language-switch";
import { SiteHeader } from "@/components/site-header";

/** The signed-out frame: the same header as inside the app, with the logo leading to About. */
export async function PublicShell({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("nav");
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader logoHref="/about" logoLabel={t("about")}>
        <LanguageSwitch />
      </SiteHeader>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-12">{children}</main>
    </div>
  );
}
