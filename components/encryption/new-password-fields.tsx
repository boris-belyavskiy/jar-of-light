"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MIN_PASSWORD_LENGTH } from "@/lib/crypto";
import { passwordStrength, type Strength } from "@/lib/password-strength";

const BAR: Record<Strength, { filled: number; color: string }> = {
  weak: { filled: 1, color: "bg-destructive" },
  fair: { filled: 2, color: "bg-primary" },
  strong: { filled: 3, color: "bg-success" },
};

/**
 * A new diary password typed twice, with a hint about its strength (ADR-0013).
 * The hint never blocks: only the length does. The page decides what to do
 * with the two values; `mismatch` says they differ.
 */
export function NewPasswordFields({
  password,
  confirm,
  onPassword,
  onConfirm,
  label,
}: {
  password: string;
  confirm: string;
  onPassword(value: string): void;
  onConfirm(value: string): void;
  label?: string;
}) {
  const t = useTranslations("encryption");
  const id = useId();
  const strength = passwordStrength(password);
  const shown = password ? BAR[strength] : { filled: 0, color: "" };
  const mismatch = confirm.length > 0 && confirm !== password;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${id}-new`}>{label ?? t("newPassword")}</Label>
        <Input
          id={`${id}-new`}
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => onPassword(e.target.value)}
          aria-describedby={`${id}-hint`}
          className="bg-card"
        />
        <div aria-hidden="true" className="flex gap-1">
          {[1, 2, 3].map((i) => (
            <span key={i} className={`h-1 flex-1 rounded-full ${i <= shown.filled ? shown.color : "bg-border"}`} />
          ))}
        </div>
        <p id={`${id}-hint`} className="text-sm text-muted-foreground" aria-live="polite">
          {password ? t(`strength.${strength}`) : t("passwordHint", { min: MIN_PASSWORD_LENGTH })}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${id}-confirm`}>{t("confirmPassword")}</Label>
        <Input
          id={`${id}-confirm`}
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => onConfirm(e.target.value)}
          aria-invalid={mismatch || undefined}
          className="bg-card"
        />
        {mismatch && (
          <p role="alert" className="text-sm text-destructive">
            {t("errors.mismatch")}
          </p>
        )}
      </div>
    </div>
  );
}

/** Whether the pair is acceptable to submit: long enough and typed the same twice. */
export function newPasswordReady(password: string, confirm: string) {
  return [...password.normalize("NFKC")].length >= MIN_PASSWORD_LENGTH && password === confirm;
}
