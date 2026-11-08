"use client";

import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CryptoError, normalizeRecoveryCode } from "@/lib/crypto";

function sameCode(typed: string, code: string) {
  try {
    return normalizeRecoveryCode(typed) === normalizeRecoveryCode(code);
  } catch (error) {
    if (error instanceof CryptoError) return false;
    throw error;
  }
}

/**
 * Shows a recovery code once and asks for it to be typed back before anything
 * is saved (ADR-0011): a code the user never wrote down is worse than none,
 * because it promises a way back that does not exist.
 */
export function RecoveryCodeStep({
  code,
  busy,
  error,
  onConfirmed,
}: {
  code: string;
  busy: boolean;
  error: string | null;
  onConfirmed(): void;
}) {
  const t = useTranslations("encryption");
  const [typed, setTyped] = useState("");
  const [copied, setCopied] = useState(false);
  const matches = sameCode(typed, code);
  const wrong = typed.length >= code.length - 6 && !matches;

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      // Clipboard blocked: the code is on screen and can be copied by hand.
    }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([t("recovery.fileText", { code })], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "jar-of-light-recovery-code.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm">{t("recovery.explain")}</p>
      <p
        data-testid="recovery-code"
        className="rounded-xl bg-sky/50 px-4 py-3 text-center font-mono text-lg tracking-wider break-all select-all"
      >
        {code}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={copy}>
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied ? t("recovery.copied") : t("recovery.copy")}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={download}>
          <Download aria-hidden="true" />
          {t("recovery.download")}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">{t("recovery.warning")}</p>
      <div className="flex flex-col gap-2">
        <Label htmlFor="recovery-typed">{t("recovery.typeBack")}</Label>
        <Input
          id="recovery-typed"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-invalid={wrong || undefined}
          className="bg-card font-mono"
        />
        {wrong && (
          <p role="alert" className="text-sm text-destructive">
            {t("recovery.mismatch")}
          </p>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="button" disabled={!matches || busy} onClick={onConfirmed} className="self-start">
        {busy ? t("working") : t("recovery.confirm")}
      </Button>
    </div>
  );
}
