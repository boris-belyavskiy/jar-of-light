import { getTranslations } from "next-intl/server";
import { GoogleSignIn } from "@/components/google-sign-in";
import { JarMark } from "@/components/jar-mark";
import { PageLayout } from "@/components/page-layout";
import { PublicShell } from "@/components/public-shell";

export default async function LandingPage({ searchParams }: PageProps<"/">) {
  const t = await getTranslations("landing");
  const tm = await getTranslations("meta");
  const { deleted } = await searchParams;

  return (
    <PublicShell>
      <PageLayout>
        {/* A narrow column in the center (ADR-0009), just wide enough for each point to fit on
            one line. It is centered, except the main text (justified) and the points (left-aligned). */}
        <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
          <div className="flex flex-col items-center gap-3 px-4">
            <div className="rounded-full bg-sky p-4 text-primary shadow-sm">
              <JarMark className="size-12" />
            </div>
            <h1 className="text-center font-heading text-[2rem] leading-tight font-semibold">{tm("title")}</h1>
            <p className="reading self-stretch">{t("lead")}</p>
          </div>

          {deleted && (
            <p role="status" className="rounded-xl bg-card px-4 py-3 text-center text-sm text-success">
              {t("deleted")}
            </p>
          )}

          {/* Sign-in comes before the selling points so it is visible without scrolling on a phone. */}
          <div className="flex flex-col items-center gap-3 px-4">
            <GoogleSignIn />
            <p className="text-center text-sm text-muted-foreground">{t("signInHint")}</p>
          </div>

          <ul className="flex flex-col gap-2 text-sm">
            {(["quick", "private", "languages"] as const).map((key) => (
              <li key={key} className="flex items-start gap-3 rounded-xl bg-card px-4 py-3">
                <span aria-hidden="true" className="mt-1.5 size-2 shrink-0 rounded-full bg-light" />
                {t(`points.${key}`)}
              </li>
            ))}
          </ul>
        </div>
      </PageLayout>
    </PublicShell>
  );
}
