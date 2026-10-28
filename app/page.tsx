import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { GoogleSignIn } from "@/components/google-sign-in";
import { JarMark } from "@/components/jar-mark";
import { LanguageSwitch } from "@/components/language-switch";

export default async function LandingPage({ searchParams }: PageProps<"/">) {
  const t = await getTranslations("landing");
  const tm = await getTranslations("meta");
  const { deleted } = await searchParams;

  return (
    <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-8 px-6 py-12 text-center">
      <LanguageSwitch className="absolute top-4 right-4" />
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-full bg-sky p-5 text-primary shadow-sm">
          <JarMark className="size-16" />
        </div>
        <h1 className="font-heading text-[2rem] leading-tight font-semibold">{tm("title")}</h1>
        <p className="text-[1.0625rem] text-muted-foreground">{t("lead")}</p>
      </div>

      {deleted && (
        <p role="status" className="rounded-xl bg-card px-4 py-3 text-sm text-success">
          {t("deleted")}
        </p>
      )}

      <ul className="flex w-full flex-col gap-2 text-left text-sm">
        {(["quick", "private", "languages"] as const).map((key) => (
          <li key={key} className="flex items-start gap-3 rounded-xl bg-card px-4 py-3">
            <span aria-hidden="true" className="mt-1.5 size-2 shrink-0 rounded-full bg-light" />
            {t(`points.${key}`)}
          </li>
        ))}
      </ul>

      <div className="flex flex-col items-center gap-3">
        <GoogleSignIn />
        <p className="text-sm text-muted-foreground">{t("signInHint")}</p>
        <Link href="/privacy" className="text-sm text-primary underline-offset-4 hover:underline">
          {t("privacyLink")}
        </Link>
      </div>
    </main>
  );
}
