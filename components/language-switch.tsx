import { getLocale, getTranslations } from "next-intl/server";
import { setLocale } from "@/app/actions/account";
import { locales } from "@/i18n/config";
import { cn } from "@/lib/utils";

/** RU | EN toggle; works without JavaScript because it is a plain form. */
export async function LanguageSwitch({ className }: { className?: string }) {
  const [current, t] = await Promise.all([getLocale(), getTranslations("languages")]);
  return (
    <form action={setLocale} className={cn("flex rounded-full p-0.5 ring-1 ring-border", className)}>
      {locales.map((locale) => (
        <button
          key={locale}
          type="submit"
          name="locale"
          value={locale}
          lang={locale}
          aria-label={t(locale)}
          aria-pressed={locale === current}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium uppercase transition-colors",
            locale === current ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-sky",
          )}
        >
          {locale}
        </button>
      ))}
    </form>
  );
}
