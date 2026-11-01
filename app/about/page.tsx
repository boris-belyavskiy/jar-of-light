import type { Metadata } from "next";
import { Fragment, type ReactNode } from "react";
import { getMessages, getTranslations } from "next-intl/server";
import { PublicPage } from "@/components/public-page";
import { JarMark } from "@/components/jar-mark";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("about");
  return { title: t("title") };
}

type Source = { text: string; url: string };

/** What the project is for and the research behind it; open to everyone, like /privacy. */
export default async function AboutPage() {
  const t = await getTranslations("about");
  const messages = await getMessages();
  const sources = (messages.about as { sources: Source[] }).sources;
  // <ref>2</ref> in the text becomes a superscript link to source 2 below; <ref>3,4,5</ref> to three sources.
  const ref = (chunks: ReactNode) => (
    <sup className="ml-0.5">
      {String(chunks)
        .split(",")
        .map((n, i) => (
          <Fragment key={n}>
            {i > 0 && ","}
            <a href={`#source-${n}`} className="text-primary underline-offset-2 hover:underline">
              {n}
            </a>
          </Fragment>
        ))}
    </sup>
  );

  return (
    <PublicPage>
      <div className="flex items-center gap-3 text-primary">
        <JarMark className="size-10" />
        <h1 className="font-heading text-[2rem] leading-tight font-semibold text-foreground">{t("title")}</h1>
      </div>

      <p className="mt-8 font-heading text-xl font-semibold">{t("headline")}</p>
      <p className="mt-3 text-[1.0625rem] leading-relaxed">{t("intro")}</p>
      <p className="mt-4 leading-relaxed text-muted-foreground">{t("story")}</p>

      <section className="mt-8">
        <h2 className="font-heading text-xl font-semibold">{t("whyTitle")}</h2>
        <p className="mt-2 leading-relaxed text-muted-foreground">{t.rich("why", { ref })}</p>
      </section>

      <p className="mt-6 leading-relaxed text-muted-foreground">{t("outro")}</p>

      <section className="mt-10 border-t pt-6">
        <h2 className="text-sm font-semibold">{t("sourcesTitle")}</h2>
        <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-xs leading-relaxed text-muted-foreground">
          {sources.map((s, i) => (
            <li key={s.url} id={`source-${i + 1}`} className="scroll-mt-6">
              {s.text}{" "}
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-primary underline-offset-2 hover:underline"
              >
                {s.url.replace("https://", "")}
              </a>
            </li>
          ))}
        </ol>
      </section>
    </PublicPage>
  );
}
