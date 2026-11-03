import type { Metadata } from "next";
import { getMessages, getTranslations } from "next-intl/server";
import { PublicPage } from "@/components/public-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("privacy");
  return { title: t("title") };
}

type Section = { heading: string; body: string };

/** DATA-04: the short privacy note, also the privacy-policy link Google sign-in requires. */
export default async function PrivacyPage() {
  const t = await getTranslations("privacy");
  const messages = await getMessages();
  const sections = (messages.privacy as { sections: Section[] }).sections;

  return (
    <PublicPage
      head={
        <>
          <h1 className="font-heading text-2xl font-semibold">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("updated")}</p>
        </>
      }
    >
      <p className="reading">{t("intro")}</p>
      {sections.map((s) => (
        <section key={s.heading} className="mt-8">
          <h2 className="font-heading text-xl font-semibold">{s.heading}</h2>
          <p className="reading mt-2">{s.body}</p>
        </section>
      ))}
    </PublicPage>
  );
}
