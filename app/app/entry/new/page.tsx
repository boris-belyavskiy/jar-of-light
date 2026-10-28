import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createEntry } from "@/app/actions/entries";
import { EntryForm } from "@/components/journal/entry-form";
import { getProfile, listCategories } from "@/lib/db/queries";
import { nowInTimeZone } from "@/lib/time";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("entry"))("newTitle") };
}

export default async function NewEntryPage() {
  const [profile, categories, t] = await Promise.all([getProfile(), listCategories(), getTranslations("entry")]);
  // "Now" by default, in the user's time zone rather than the server's (ACC-04).
  const now = nowInTimeZone(profile.timezone);

  return (
    <>
      <h1 className="mb-6 font-heading text-2xl font-semibold">{t("newTitle")}</h1>
      <EntryForm
        action={createEntry}
        categories={categories.filter((c) => !c.hidden)}
        initial={{ body: "", occurredOn: now.date, occurredTime: now.time, categoryIds: [] }}
        today={now.date}
      />
    </>
  );
}
