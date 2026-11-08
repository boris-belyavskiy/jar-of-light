"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Menu } from "@base-ui/react/menu";
import { Ellipsis, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { deleteEntry } from "@/app/actions/entries";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

const ITEM =
  "flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm outline-none data-highlighted:bg-sky";

/** The small "⋯" menu in an entry's top-right corner: edit, or delete after a confirmation (ENT-05). */
export function EntryMenu({ id, editHref, afterDelete }: { id: string; editHref: string; afterDelete: string }) {
  const t = useTranslations("entry");
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <Menu.Root>
        <Menu.Trigger
          aria-label={t("actions")}
          className="relative z-10 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-sky hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Ellipsis className="size-5" aria-hidden="true" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner sideOffset={4} align="end" className="z-50">
            <Menu.Popup className="min-w-40 rounded-xl bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none">
              <Menu.LinkItem render={<Link href={editHref} scroll={false} />} className={ITEM}>
                <Pencil className="size-4" aria-hidden="true" />
                {t("edit")}
              </Menu.LinkItem>
              <Menu.Item className={`${ITEM} text-destructive`} onClick={() => setConfirming(true)}>
                <Trash2 className="size-4" aria-hidden="true" />
                {t("deleteShort")}
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>{t("cancel")}</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => startTransition(() => deleteEntry(id, afterDelete))}
            >
              {t("deleteConfirm")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
