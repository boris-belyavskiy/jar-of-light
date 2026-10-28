"use client";

import { useActionState, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { deleteAccount, updateProfile } from "@/app/actions/account";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { locales } from "@/i18n/config";
import type { Profile } from "@/lib/db/queries";
import { DISPLAY_NAME_MAX_LENGTH } from "@/lib/validation";

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function SettingsForm({ profile, timeZones }: { profile: Profile; timeZones: string[] }) {
  const t = useTranslations("settings");
  const tl = useTranslations("languages");
  const tAll = useTranslations();
  const [state, action, pending] = useActionState(updateProfile, {});
  const [timezone, setTimezone] = useState(profile.timezone);
  const [browserZone, setBrowserZone] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    // Read after hydration: the server doesn't know the device's zone.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBrowserZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h2 className="font-heading text-xl font-semibold">{t("profileTitle")}</h2>
        <form action={action} className="mt-4 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="displayName">{t("displayName")}</Label>
            <Input
              id="displayName"
              name="displayName"
              maxLength={DISPLAY_NAME_MAX_LENGTH}
              defaultValue={profile.displayName}
              className="bg-card"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="locale">{t("language")}</Label>
            <select id="locale" name="locale" defaultValue={profile.locale ?? "en"} className={selectClass}>
              {locales.map((l) => (
                <option key={l} value={l}>
                  {tl(l)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="timezone">{t("timezone")}</Label>
            <select
              id="timezone"
              name="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className={selectClass}
            >
              {timeZones.map((z) => (
                <option key={z} value={z}>
                  {z.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            <p className="text-sm text-muted-foreground">{t("timezoneHint")}</p>
            {browserZone && browserZone !== timezone && timeZones.includes(browserZone) && (
              <Button type="button" variant="link" className="h-auto self-start p-0" onClick={() => setTimezone(browserZone)}>
                {t("useBrowserTimezone", { zone: browserZone.replaceAll("_", " ") })}
              </Button>
            )}
          </div>
          {state.error && (
            <p role="alert" className="text-sm text-destructive">
              {tAll(state.error)}
            </p>
          )}
          {state.ok && (
            <p role="status" className="text-sm text-success">
              {t("saved")}
            </p>
          )}
          <Button type="submit" disabled={pending} className="self-start">
            {t("save")}
          </Button>
        </form>
      </section>

      <section className="rounded-2xl p-4 ring-1 ring-destructive/40">
        <h2 className="font-heading text-xl font-semibold">{t("dangerTitle")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("dangerBody")}</p>
        <div className="mt-4">
          <ConfirmDialog
            trigger={t("deleteAccount")}
            title={t("deleteTitle")}
            description={t("deleteBody")}
            confirmLabel={t("deleteConfirm")}
            cancelLabel={t("cancel")}
            onConfirm={async () => {
              const result = await deleteAccount();
              if (result?.error) setDeleteError(result.error);
            }}
          />
        </div>
        {deleteError && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            {tAll(deleteError)}
          </p>
        )}
      </section>
    </div>
  );
}
