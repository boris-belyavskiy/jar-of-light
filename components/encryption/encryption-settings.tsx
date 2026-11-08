"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { keyErrorKey } from "./key-errors";
import { useKeys, type PreparedRecoveryCode, type PreparedSetup } from "./key-provider";
import { NewPasswordFields, newPasswordReady } from "./new-password-fields";
import { RecoveryCodeStep } from "./recovery-code-step";
import { RememberCheckbox } from "./remember-checkbox";
import { UnlockForm } from "./unlock-form";

/**
 * The "Encryption" section of Settings (ADR-0011, ADR-0013): turn it on, then
 * keep it up: lock this device, change the diary password, get a new recovery
 * code. Everything here runs on the device; the server only stores the wrapped keys.
 */
export function EncryptionSettings() {
  const t = useTranslations("encryption");
  const { status } = useKeys();

  return (
    <section id="encryption" className="scroll-mt-32">
      <h2 className="font-heading text-xl font-semibold">{t("title")}</h2>
      <div className="mt-4">
        {status === "loading" && <p className="text-sm text-muted-foreground">{t("working")}</p>}
        {status === "off" && <TurnOn />}
        {status === "locked" && <Locked />}
        {status === "unlocked" && <On />}
      </div>
    </section>
  );
}

// --- Off: set up -------------------------------------------------------------

function TurnOn() {
  const t = useTranslations("encryption");
  const { prepareSetup, confirmSetup } = useKeys();
  const [started, setStarted] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [remember, setRemember] = useState(true);
  const [prepared, setPrepared] = useState<PreparedSetup | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <p role="status" className="text-sm text-success">
        {t("turnOn.done")}
      </p>
    );
  }

  if (!started) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm">{t("turnOn.intro")}</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>{t("turnOn.pointOperator")}</li>
          <li>{t("turnOn.pointLoss")}</li>
          <li>{t("turnOn.pointRollout")}</li>
        </ul>
        <Button type="button" onClick={() => setStarted(true)} className="self-start">
          {t("turnOn.start")}
        </Button>
      </div>
    );
  }

  if (prepared) {
    return (
      <RecoveryCodeStep
        code={prepared.recoveryCode}
        busy={pending}
        error={error}
        onConfirmed={() => {
          setError(null);
          startTransition(async () => {
            try {
              await confirmSetup(prepared, remember);
              setDone(true);
            } catch (e) {
              setError(t(`errors.${keyErrorKey(e)}`));
            }
          });
        }}
      />
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          try {
            setPrepared(await prepareSetup(password));
          } catch (err) {
            setError(t(`errors.${keyErrorKey(err)}`));
          }
        });
      }}
      className="flex flex-col gap-4"
    >
      <p className="text-sm">{t("turnOn.passwordExplain")}</p>
      <NewPasswordFields password={password} confirm={confirm} onPassword={setPassword} onConfirm={setConfirm} label={t("turnOn.password")} />
      <RememberCheckbox checked={remember} onChange={setRemember} />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending || !newPasswordReady(password, confirm)} className="self-start">
        {pending ? t("turnOn.preparing") : t("turnOn.next")}
      </Button>
    </form>
  );
}

// --- On, this device locked --------------------------------------------------

function Locked() {
  const t = useTranslations("encryption");
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm">{t("status.locked")}</p>
      <UnlockForm />
    </div>
  );
}

// --- On, this device unlocked ------------------------------------------------

function On() {
  const t = useTranslations("encryption");
  const { lock, remembered } = useKeys();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-6">
      <p role="status" className="text-sm">
        {t("status.unlocked")}
      </p>
      <div>
        <Button type="button" variant="outline" disabled={pending} onClick={() => startTransition(() => lock())}>
          {t("header.lockNow")}
        </Button>
        <p className="mt-2 text-sm text-muted-foreground">{remembered ? t("status.remembered") : t("status.sessionOnly")}</p>
      </div>
      <ChangePassword />
      <NewRecoveryCode />
    </div>
  );
}

function ChangePassword() {
  const t = useTranslations("encryption");
  const { changePassword } = useKeys();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <div>
        <Button type="button" variant="outline" onClick={() => { setOpen(true); setSaved(false); }}>
          {t("change.open")}
        </Button>
        {saved && (
          <p role="status" className="mt-2 text-sm text-success">
            {t("change.done")}
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          try {
            await changePassword(current, password);
            setOpen(false);
            setSaved(true);
            setCurrent("");
            setPassword("");
            setConfirm("");
          } catch (err) {
            setError(t(`errors.${keyErrorKey(err)}`));
          }
        });
      }}
      className="flex flex-col gap-4 rounded-2xl p-4 ring-1 ring-border"
    >
      <h3 className="font-heading text-base font-medium">{t("change.title")}</h3>
      <div className="flex flex-col gap-2">
        <Label htmlFor="current-password">{t("change.current")}</Label>
        <Input
          id="current-password"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className="bg-card"
        />
      </div>
      <NewPasswordFields password={password} confirm={confirm} onPassword={setPassword} onConfirm={setConfirm} />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending || !current || !newPasswordReady(password, confirm)}>
          {pending ? t("working") : t("change.submit")}
        </Button>
        <Button type="button" variant="ghost" disabled={pending} onClick={() => setOpen(false)}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}

function NewRecoveryCode() {
  const t = useTranslations("encryption");
  const { prepareNewRecoveryCode, confirmNewRecoveryCode } = useKeys();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [prepared, setPrepared] = useState<PreparedRecoveryCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setPrepared(null);
    setPassword("");
    setError(null);
  }

  if (!open) {
    return (
      <div>
        <Button type="button" variant="outline" onClick={() => { setOpen(true); setSaved(false); }}>
          {t("newCode.open")}
        </Button>
        <p className="mt-2 text-sm text-muted-foreground">{t("newCode.hint")}</p>
        {saved && (
          <p role="status" className="mt-2 text-sm text-success">
            {t("newCode.done")}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl p-4 ring-1 ring-border">
      <h3 className="font-heading text-base font-medium">{t("newCode.title")}</h3>
      {prepared ? (
        <>
          <p className="text-sm text-muted-foreground">{t("newCode.oldStillWorks")}</p>
          <RecoveryCodeStep
            code={prepared.recoveryCode}
            busy={pending}
            error={error}
            onConfirmed={() => {
              setError(null);
              startTransition(async () => {
                try {
                  await confirmNewRecoveryCode(prepared);
                  close();
                  setSaved(true);
                } catch (e) {
                  setError(t(`errors.${keyErrorKey(e)}`));
                }
              });
            }}
          />
        </>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            startTransition(async () => {
              try {
                setPrepared(await prepareNewRecoveryCode(password));
              } catch (err) {
                setError(t(`errors.${keyErrorKey(err)}`));
              }
            });
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="newcode-password">{t("newCode.password")}</Label>
            <Input
              id="newcode-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-card"
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={pending || !password}>
              {pending ? t("working") : t("newCode.next")}
            </Button>
            <Button type="button" variant="ghost" disabled={pending} onClick={close}>
              {t("cancel")}
            </Button>
          </div>
        </form>
      )}
      {prepared && (
        <Button type="button" variant="ghost" disabled={pending} onClick={close} className="self-start">
          {t("cancel")}
        </Button>
      )}
    </div>
  );
}
