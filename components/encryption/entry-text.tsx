"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useKeys } from "./key-provider";

/**
 * The text of an entry, as a paragraph. Readable text is shown as it is;
 * ciphertext is decrypted on the device when it has the key (ADR-0011), and
 * otherwise shows that it is locked. Plaintext wins while a row holds both,
 * which is only during the move of an old account.
 */
export function EntryText({
  entryId,
  body,
  bodyCipher,
  className,
}: {
  entryId: string;
  body: string | null;
  bodyCipher: string | null;
  className?: string;
}) {
  const t = useTranslations("feed");
  const { status, decrypt } = useKeys();
  const [result, setResult] = useState<{ cipher: string; text: string | null } | null>(null);
  const unlocked = status === "unlocked";

  useEffect(() => {
    if (body !== null || !bodyCipher || !unlocked) return;
    let cancelled = false;
    decrypt({ table: "entries", rowId: entryId, field: "body" }, bodyCipher)
      .then((text) => !cancelled && setResult({ cipher: bodyCipher, text }))
      .catch(() => !cancelled && setResult({ cipher: bodyCipher, text: null })); // changed or moved: never shown, never logged
    return () => {
      cancelled = true;
    };
    // `decrypt` changes identity with the key state; the key state is already in `unlocked`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryId, body, bodyCipher, unlocked]);

  if (body !== null) return <p className={className}>{body}</p>;

  const muted = cn(className, "text-muted-foreground italic");
  if (!unlocked) return <p className={muted}>{status === "loading" ? "…" : t("locked")}</p>;
  if (!result || result.cipher !== bodyCipher) return <p className={muted}>…</p>;
  return result.text === null ? <p className={muted}>{t("cannotRead")}</p> : <p className={className}>{result.text}</p>;
}
