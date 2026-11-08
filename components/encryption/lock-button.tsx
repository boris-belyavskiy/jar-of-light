"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Lock, LockOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useKeys } from "./key-provider";
import { UnlockForm } from "./unlock-form";

/**
 * The lock in the header, shown only once encryption is on (ADR-0011). Closed:
 * this device has no key, and a click opens the unlock dialog. Open: a click
 * shows that the diary is unlocked and lets the person lock this device. The
 * button sits in the header, so no page moves when it appears (ADR-0004).
 */
export function LockButton() {
  const t = useTranslations("encryption");
  const { status, lock } = useKeys();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (status !== "locked" && status !== "unlocked") return null;
  const locked = status === "locked";
  const Icon = locked ? Lock : LockOpen;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger
        aria-label={locked ? t("header.locked") : t("header.unlocked")}
        className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-sky hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <Icon className="size-5" aria-hidden="true" />
      </DialogPrimitive.Trigger>
      <DialogContent>
        {locked ? (
          <>
            <DialogTitle>{t("unlock.title")}</DialogTitle>
            <DialogDescription>{t("unlock.description")}</DialogDescription>
            <UnlockForm onDone={() => setOpen(false)} />
          </>
        ) : (
          <>
            <DialogTitle>{t("header.unlockedTitle")}</DialogTitle>
            <DialogDescription>{t("header.unlockedBody")}</DialogDescription>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await lock();
                    setOpen(false);
                  })
                }
              >
                {t("header.lockNow")}
              </Button>
              <Link
                href="/app/settings#encryption"
                onClick={() => setOpen(false)}
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                {t("header.settings")}
              </Link>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
