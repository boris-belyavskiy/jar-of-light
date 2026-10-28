"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { completeSignIn } from "@/app/actions/account";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/browser";

// The small part of Google Identity Services we use.
type GoogleId = {
  initialize(options: {
    client_id: string;
    callback: (response: { credential: string }) => void;
    nonce: string;
    use_fedcm_for_button?: boolean;
  }): void;
  renderButton(parent: HTMLElement, options: Record<string, string | number>): void;
};
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Google's own button (Tech Spec §7.1a). Google returns a signed ID token,
 * Supabase verifies it and starts a session. The nonce ties the token to this
 * page load: Google gets its hash, Supabase gets the raw value and compares.
 */
export function GoogleSignIn() {
  const t = useTranslations("landing");
  const locale = useLocale();
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!scriptReady || !window.google || !buttonRef.current || !env.googleClientId) return;
    const google = window.google;
    const container = buttonRef.current;
    let cancelled = false;

    (async () => {
      const nonce = crypto.randomUUID();
      const hashedNonce = await sha256Hex(nonce);
      if (cancelled) return;

      google.accounts.id.initialize({
        client_id: env.googleClientId,
        nonce: hashedNonce,
        use_fedcm_for_button: true,
        callback: async ({ credential }) => {
          setFailed(false);
          const { error } = await createClient().auth.signInWithIdToken({ provider: "google", token: credential, nonce });
          if (error) {
            setFailed(true);
            return;
          }
          await completeSignIn({
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            locale: navigator.language.slice(0, 2).toLowerCase(),
          });
          router.replace("/app");
          router.refresh();
        },
      });
      container.replaceChildren();
      google.accounts.id.renderButton(container, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "continue_with",
        logo_alignment: "left",
        width: 280,
        locale,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [scriptReady, locale, router]);

  if (!env.googleClientId) return <p className="text-sm text-muted-foreground">{t("notConfigured")}</p>;

  return (
    <div className="flex flex-col items-center gap-3">
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={() => setScriptReady(true)} />
      <div ref={buttonRef} className="min-h-11" />
      {failed && (
        <p role="alert" className="text-sm text-destructive">
          {t("signInFailed")}
        </p>
      )}
    </div>
  );
}
