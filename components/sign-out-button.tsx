"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { signOut } from "@/app/actions/account";
import { useKeys } from "@/components/encryption/key-provider";
import { Button } from "@/components/ui/button";

/** Signs out, and first wipes this device's encryption key (ADR-0011): a shared computer keeps nothing. */
export function SignOutButton() {
  const t = useTranslations("nav");
  const { wipeDevice } = useKeys();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      aria-label={t("signOut")}
      className="-mr-[11px] text-muted-foreground"
      onClick={() =>
        startTransition(async () => {
          await wipeDevice();
          await signOut();
        })
      }
    >
      <LogOut aria-hidden="true" />
      <span className="hidden md:inline">{t("signOut")}</span>
    </Button>
  );
}
