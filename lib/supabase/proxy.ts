import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";

/** The policy and its nonce for this request (lib/csp.ts). */
export type CspForRequest = { nonce: string; policy: string };

/**
 * Refreshes the Supabase session cookie on every request and keeps signed-out
 * visitors out of /app. Based on the @supabase/ssr guide for Next.js.
 *
 * The Content Security Policy rides along: Next.js reads the nonce from the
 * policy on the *request* to put it on its scripts, and the browser enforces
 * the policy on the *response*.
 */
export async function updateSession(request: NextRequest, csp: CspForRequest) {
  // Built from the request each time, because setting cookies below changes its headers.
  const next = () => {
    const headers = new Headers(request.headers);
    headers.set("x-nonce", csp.nonce);
    headers.set("content-security-policy", csp.policy);
    const response = NextResponse.next({ request: { headers } });
    response.headers.set("content-security-policy", csp.policy);
    return response;
  };
  let response = next();

  const supabase = createServerClient(env.supabaseUrl, env.supabasePublishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = next();
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });

  // getClaims() validates the JWT; do not put code between client creation and this call.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);
  const { pathname } = request.nextUrl;

  if (!signedIn && pathname.startsWith("/app")) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (signedIn && pathname === "/") {
    return NextResponse.redirect(new URL("/app", request.url));
  }
  return response;
}
