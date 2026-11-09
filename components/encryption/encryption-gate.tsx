"use client";

import { useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { gateScreen } from "@/lib/crypto/gate";
import { TurnOn } from "./encryption-settings";
import { useKeys } from "./key-provider";
import { MoveRunner } from "./move-runner";
import { UnlockForm } from "./unlock-form";
import { UnmovedContext } from "./unmoved";

function Card({ title, body, children }: { title: string; body: string; children: ReactNode }) {
  return (
    <div className="mx-auto mt-10 flex max-w-xl flex-col gap-4 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border dark:shadow-none">
      <div>
        <h1 className="font-heading text-xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </div>
      {children}
    </div>
  );
}

/**
 * Setup is required (ADR-0011, ADR-0013): at the next sign-in an account with
 * no keys sets up encryption before it uses the journal, and an account whose
 * old entries are not yet moved unlocks this device and lets the move finish,
 * so the app has no lasting mixed mode. Settings stays reachable, so a person
 * can still delete their account instead; so do the public pages.
 */
export function EncryptionGate({ unmoved, children }: { unmoved: number; children: ReactNode }) {
  const t = useTranslations("encryption.gate");
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useKeys();
  // Set when a run finishes, so the page opens at once while the server's counts catch up.
  const [moved, setMoved] = useState(false);
  const which = gateScreen({ pathname, status, unmoved, moved });

  let screen: ReactNode = children;
  if (which === "setup") {
    screen = (
      <Card title={t("setupTitle")} body={t("setupBody")}>
        <TurnOn />
      </Card>
    );
  } else if (which === "unlock") {
    screen = (
      <Card title={t("unlockTitle")} body={t("unlockBody")}>
        <UnlockForm />
      </Card>
    );
  } else if (which === "move") {
    screen = (
      <MoveRunner
        onDone={() => {
          setMoved(true);
          router.refresh();
        }}
      />
    );
  }
  return <UnmovedContext.Provider value={moved ? 0 : unmoved}>{screen}</UnmovedContext.Provider>;
}
