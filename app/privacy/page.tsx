import type { Metadata } from "next";
import Link from "next/link";
import { getMessages, getTranslations } from "next-intl/server";

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
    <main className="mx-auto w-full max-w-2xl px-6 py-12">
      <Link href="/" className="text-sm text-primary underline-offset-4 hover:underline">
        ← {t("back")}
      </Link>
      <h1 className="mt-6 font-heading text-[2rem] leading-tight font-semibold">{t("title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("updated")}</p>
      <p className="mt-6 text-[1.0625rem] leading-relaxed">{t("intro")}</p>
      {sections.map((s) => (
        <section key={s.heading} className="mt-8">
          <h2 className="font-heading text-xl font-semibold">{s.heading}</h2>
          <p className="mt-2 leading-relaxed text-muted-foreground">{s.body}</p>
        </section>
      ))}
    </main>
  );
}
