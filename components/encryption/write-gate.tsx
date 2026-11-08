"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { writeMode } from "@/lib/crypto/forms";
import { TurnOn } from "./encryption-settings";
import { useKeys } from "./key-provider";
import { UnlockForm } from "./unlock-form";

/**
 * Stands in front of anything that saves text (ADR-0011, ADR-0013). When the
 * device can save, it shows its children. When it cannot, it says why and
 * offers the way forward, so the person is never left with a form that would
 * either fail or save readable text by mistake:
 *  - the account has keys but this device has no key: ask for the password;
 *  - a new account with no keys: set encryption up before the first entry.
 * `closeHref` or `onCancel` gives the person a way out.
 */
export function WriteGate({
  closeHref,
  onCancel,
  children,
}: {
  closeHref?: string;
  onCancel?: () => void;
  children: React.ReactNode;
}) {
  const t = useTranslations("encryption.write");
  const { status, needsSetup } = useKeys();
  const mode = writeMode(status, needsSetup);

  if (mode === "plain" || mode === "encrypted") return <>{children}</>;
  if (mode === "wait") return <p className="text-sm text-muted-foreground">{t("wait")}</p>;

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border dark:shadow-none">
      <div>
        <h2 className="font-heading text-lg font-semibold">{mode === "locked" ? t("lockedTitle") : t("setupTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{mode === "locked" ? t("lockedBody") : t("setupBody")}</p>
      </div>
      {mode === "locked" ? <UnlockForm /> : <TurnOn />}
      {closeHref ? (
        <Link href={closeHref} className="self-start text-sm text-primary underline-offset-4 hover:underline">
          {t("cancel")}
        </Link>
      ) : onCancel ? (
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="self-start">
          {t("cancel")}
        </Button>
      ) : null}
    </div>
  );
}
