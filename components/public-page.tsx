import { getTranslations } from "next-intl/server";
import { AppShell } from "@/components/app-shell";
import { GoogleSignIn } from "@/components/google-sign-in";
import { PageLayout } from "@/components/page-layout";
import { PublicShell } from "@/components/public-shell";
import { getUserId } from "@/lib/db/queries";

/**
 * A page open to everyone (/about, /privacy). Signed in, it opens inside the
 * app like any other tab; signed out, it uses the public shell and ends with
 * the sign-in button.
 */
export async function PublicPage({ head, children }: { head: React.ReactNode; children: React.ReactNode }) {
  if (await getUserId()) {
    return (
      <AppShell>
        <PageLayout head={head}>{children}</PageLayout>
      </AppShell>
    );
  }
  const t = await getTranslations("landing");
  return (
    <PublicShell>
      <PageLayout head={head}>
        {children}
        <div className="mt-12 flex flex-col items-center gap-3 rounded-2xl bg-card px-4 py-6 text-center ring-1 ring-border">
          <GoogleSignIn />
          <p className="text-sm text-muted-foreground">{t("signInHint")}</p>
        </div>
      </PageLayout>
    </PublicShell>
  );
}
