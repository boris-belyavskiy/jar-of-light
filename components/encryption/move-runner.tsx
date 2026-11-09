"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { moveCounts, moveFetchDual, moveFetchUnmoved, moveSave } from "@/app/actions/move";
import { Button } from "@/components/ui/button";
import { MoveError, runMove, type MoveApi, type MoveProgress, type MoveReport } from "@/lib/crypto/move";
import { useKeys } from "./key-provider";

const api: MoveApi = {
  counts: moveCounts,
  fetchUnmoved: moveFetchUnmoved,
  saveMoved: moveSave,
  fetchDual: moveFetchDual,
};

/**
 * Moves the existing content of an unlocked account to ciphertext and checks it
 * (Horizon 1 step 3). Starts by itself; nothing is erased. If the tab is closed
 * or the connection drops, the next run continues from what is left. Shows
 * only counts: never a title, a name or a piece of text. `api` is the server;
 * a harness can pass a stand-in.
 */
export function MoveRunner({ onDone, api: source = api }: { onDone(report: MoveReport): void; api?: MoveApi }) {
  const t = useTranslations("encryption.move");
  const { encrypt, decrypt } = useKeys();
  const [progress, setProgress] = useState<MoveProgress | null>(null);
  const [error, setError] = useState<"stuck" | "unverified" | "failed" | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const signal = { aborted: false };
    // A new attempt starts clean.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(null);
    runMove({ api: source, crypto: { encrypt, decrypt }, onProgress: setProgress, signal })
      .then((report) => {
        if (!signal.aborted) onDone(report);
      })
      .catch((e: unknown) => {
        if (signal.aborted) return;
        // Only the kind of failure is kept, never a message, because nothing here may carry text.
        setError(e instanceof MoveError && (e.code === "stuck" || e.code === "unverified") ? e.code : "failed");
      });
    return () => {
      signal.aborted = true;
    };
    // The key functions change identity with the key state, which does not change during a run;
    // a new attempt is the only reason to start again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const encrypting = progress?.phase === "encrypting";
  const share = progress && progress.total > 0 ? Math.min(1, progress.encrypted / progress.total) : 0;

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border dark:shadow-none">
      <div>
        <h2 className="font-heading text-lg font-semibold">{t("title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("body")}</p>
      </div>
      {error ? (
        <>
          <p role="alert" className="text-sm text-destructive">
            {t(`errors.${error}`)}
          </p>
          <Button type="button" onClick={() => setAttempt((n) => n + 1)} className="self-start">
            {t("retry")}
          </Button>
        </>
      ) : (
        <>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={encrypting ? Math.round(share * 100) : 100}
            className="h-2 overflow-hidden rounded-full bg-muted"
          >
            <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${(encrypting ? share : 1) * 100}%` }} />
          </div>
          <p className="text-sm" aria-live="polite">
            {!progress
              ? t("starting")
              : encrypting
                ? t("encrypting", { done: progress.encrypted, total: progress.total })
                : t("checking", { count: progress.checked })}
          </p>
          <p className="text-sm text-muted-foreground">{t("keepOpen")}</p>
        </>
      )}
    </div>
  );
}
