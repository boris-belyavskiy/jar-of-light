"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { keyErrorKey } from "./key-errors";
import { useKeys } from "./key-provider";
import { NewPasswordFields, newPasswordReady } from "./new-password-fields";
import { RememberCheckbox } from "./remember-checkbox";

/**
 * Unlock this device with the diary password; or, when the password is
 * forgotten, with the recovery code plus a new password. Used in the header's
 * dialog and in Settings, so both show the same thing (ADR-0004).
 */
export function UnlockForm({ onDone }: { onDone?: () => void }) {
  const t = useTranslations("encryption");
  const { unlock, resetPassword } = useKeys();
  const [mode, setMode] = useState<"password" | "reset">("password");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(work: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await work();
        onDone?.();
      } catch (e) {
        setError(t(`errors.${keyErrorKey(e)}`));
      }
    });
  }

  if (mode === "reset") {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(() => resetPassword(code, next, remember));
        }}
        className="flex flex-col gap-4"
      >
        <p className="text-sm text-muted-foreground">{t("unlock.resetExplain")}</p>
        <div className="flex flex-col gap-2">
          <Label htmlFor="unlock-code">{t("unlock.recoveryCode")}</Label>
          <Input
            id="unlock-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className="bg-card font-mono"
          />
        </div>
        <NewPasswordFields password={next} confirm={confirm} onPassword={setNext} onConfirm={setConfirm} />
        <RememberCheckbox checked={remember} onChange={setRemember} />
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending || !code || !newPasswordReady(next, confirm)}>
            {pending ? t("working") : t("unlock.reset")}
          </Button>
          <Button type="button" variant="link" className="h-auto p-0" onClick={() => setMode("password")}>
            {t("unlock.back")}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(() => unlock(password, remember));
      }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="unlock-password">{t("unlock.password")}</Label>
        <Input
          id="unlock-password"
          type="password"
          autoComplete="current-password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={error ? true : undefined}
          className="bg-card"
        />
      </div>
      <RememberCheckbox checked={remember} onChange={setRemember} />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending || !password}>
          {pending ? t("working") : t("unlock.submit")}
        </Button>
        <Button type="button" variant="link" className="h-auto p-0" onClick={() => setMode("reset")}>
          {t("unlock.forgot")}
        </Button>
      </div>
    </form>
  );
}
