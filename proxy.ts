import type { NextRequest } from "next/server";
import { buildCsp, newNonce } from "@/lib/csp";
import { env } from "@/lib/env";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const nonce = newNonce();
  const policy = buildCsp({ nonce, supabaseUrl: env.supabaseUrl, isDev: process.env.NODE_ENV === "development" });
  return updateSession(request, { nonce, policy });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
