"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";

/**
 * "Remember on this device" (ADR-0014): on by default, so the diary password is
 * asked once per device. Unchecked on a shared computer, the key lives only
 * while this tab is open.
 */
export function RememberCheckbox({ checked, onChange }: { checked: boolean; onChange(value: boolean): void }) {
  const t = useTranslations("encryption");
  const id = useId();
  return (
    <div className="flex items-start gap-2">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-primary"
      />
      <label htmlFor={id} className="flex flex-col gap-0.5 text-sm">
        <span className="font-medium">{t("remember.label")}</span>
        <span className="text-muted-foreground">{t("remember.hint")}</span>
      </label>
    </div>
  );
}
