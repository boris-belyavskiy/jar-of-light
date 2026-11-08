"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { FormState } from "@/app/actions/state";
import { EntryForm, type EntryFormOption } from "@/components/journal/entry-form";
import { useKeys } from "./key-provider";
import { WriteGate } from "./write-gate";

/**
 * Editing an entry (ADR-0011). On an encrypted account the form can save only
 * when this device has the key, so it waits behind the write gate; an entry
 * stored as ciphertext is decrypted into the form first. Saving always writes
 * ciphertext on such an account, even for an old entry that was readable text.
 */
export function EditEntry({
  action,
  categories,
  entry,
  href,
  closeHref,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  categories: EntryFormOption[];
  entry: {
    id: string;
    body: string | null;
    bodyCipher: string | null;
    occurredOn: string;
    occurredTime: string;
    categoryIds: string[];
  };
  href: string;
  closeHref: string;
}) {
  const t = useTranslations("feed");
  const { status, decrypt } = useKeys();
  const [opened, setOpened] = useState<{ cipher: string; text: string | null } | null>(null);
  const unlocked = status === "unlocked";

  useEffect(() => {
    if (entry.body !== null || !entry.bodyCipher || !unlocked) return;
    let cancelled = false;
    const cipher = entry.bodyCipher;
    decrypt({ table: "entries", rowId: entry.id, field: "body" }, cipher)
      .then((text) => !cancelled && setOpened({ cipher, text }))
      .catch(() => !cancelled && setOpened({ cipher, text: null }));
    return () => {
      cancelled = true;
    };
    // `decrypt` changes identity with the key state; `unlocked` already carries it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.id, entry.body, entry.bodyCipher, unlocked]);

  let body = entry.body;
  if (body === null) {
    const ready = opened && opened.cipher === entry.bodyCipher;
    if (!unlocked) return <WriteGate closeHref={closeHref}>{<p className="text-muted-foreground">{t("locked")}</p>}</WriteGate>;
    if (!ready) return <p className="text-sm text-muted-foreground">…</p>;
    if (opened.text === null) return <p className="text-destructive">{t("cannotRead")}</p>;
    body = opened.text;
  }

  return (
    <WriteGate closeHref={closeHref}>
      <EntryForm
        action={action}
        categories={categories}
        initial={{ body, occurredOn: entry.occurredOn, occurredTime: entry.occurredTime, categoryIds: entry.categoryIds }}
        entryId={entry.id}
        href={href}
        closeHref={closeHref}
      />
    </WriteGate>
  );
}
