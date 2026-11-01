import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { deleteEntry, updateEntry } from "@/app/actions/entries";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EntryForm } from "@/components/journal/entry-form";
import { getEntry, listCategories } from "@/lib/db/queries";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("entry"))("editTitle") };
}

export default async function EditEntryPage({ params }: PageProps<"/app/entry/[id]">) {
  const { id } = await params;
  const t = await getTranslations("entry");
  const entry = UUID.test(id) ? await getEntry(id) : null;

  if (!entry) {
    return (
      <div className="mt-12 flex flex-col items-center gap-4 text-center">
        <p className="text-muted-foreground">{t("notFound")}</p>
        <Link href="/app" className="text-primary underline-offset-4 hover:underline">
          ← {t("cancel")}
        </Link>
      </div>
    );
  }

  const categories = await listCategories();
  // Hidden categories stay selectable on entries that already use them.
  const options = categories.filter((c) => !c.hidden || entry.categoryIds.includes(c.id));

  return (
    <>
      <h1 className="mb-6 font-heading text-2xl font-semibold">{t("editTitle")}</h1>
      <EntryForm
        action={updateEntry.bind(null, entry.id)}
        categories={options}
        initial={entry}
      />
      <div className="mt-10 border-t pt-6">
        <ConfirmDialog
          trigger={t("delete")}
          title={t("deleteTitle")}
          description={t("deleteBody")}
          confirmLabel={t("deleteConfirm")}
          cancelLabel={t("cancel")}
          onConfirm={deleteEntry.bind(null, entry.id)}
        />
      </div>
    </>
  );
}
