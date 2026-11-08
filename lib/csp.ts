/**
 * The Content Security Policy (ADR-0011, Tech Spec §5.6). Cross-site scripting
 * would reach the encryption key that lives on the device, so scripts run only
 * if they carry this request's random nonce, or were started by one that does
 * (`'strict-dynamic'`). Built per request in `proxy.ts`, because a nonce must
 * be fresh each time. Every page here is rendered per request (ADR-0003), which
 * is what lets Next.js put the nonce on its own scripts.
 *
 * The allowances beyond our own origin are exactly what Google Identity
 * Services needs for the sign-in button, and our Supabase project.
 * Styles allow inline attributes because the charts size their bars with
 * `style`; styles cannot run code, so this does not weaken the script rule.
 */

const GOOGLE_SIGN_IN = {
  frame: "https://accounts.google.com/gsi/",
  connect: "https://accounts.google.com/gsi/",
  style: "https://accounts.google.com/gsi/style",
};

export function newNonce(): string {
  return btoa(crypto.randomUUID());
}

/** The scheme and host of a URL, or null when it is not a valid one. */
function originOf(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

export function buildCsp({
  nonce,
  supabaseUrl,
  isDev = false,
}: {
  nonce: string;
  supabaseUrl: string;
  isDev?: boolean;
}): string {
  const supabase = originOf(supabaseUrl);
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // 'wasm-unsafe-eval' lets the Argon2id WebAssembly module (lib/crypto) compile; it does not
    // allow eval() or new Function(). React needs eval only in development, for readable error stacks.
    "script-src": [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      "'wasm-unsafe-eval'",
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],
    "style-src": ["'self'", "'unsafe-inline'", GOOGLE_SIGN_IN.style],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'"],
    "connect-src": [
      "'self'",
      ...(supabase ? [supabase] : []),
      GOOGLE_SIGN_IN.connect,
      // The development server reloads pages over a WebSocket.
      ...(isDev ? ["ws://localhost:*", "ws://127.0.0.1:*"] : []),
    ],
    "frame-src": [GOOGLE_SIGN_IN.frame],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };
  const policy = Object.entries(directives).map(([name, values]) => `${name} ${values.join(" ")}`);
  if (!isDev) policy.push("upgrade-insecure-requests");
  return policy.join("; ");
}
