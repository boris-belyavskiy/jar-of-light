import { describe, expect, it } from "vitest";
import { buildCsp, newNonce } from "@/lib/csp";

const SUPABASE = "https://abcdefgh.supabase.co";
const directive = (csp: string, name: string) =>
  csp
    .split("; ")
    .find((d) => d.startsWith(`${name} `))
    ?.split(" ")
    .slice(1) ?? [];

describe("buildCsp", () => {
  const csp = buildCsp({ nonce: "NONCE", supabaseUrl: `${SUPABASE}/` });

  it("lets scripts run only with the request's nonce, never inline or from eval", () => {
    const scripts = directive(csp, "script-src");
    expect(scripts).toContain("'nonce-NONCE'");
    expect(scripts).toContain("'strict-dynamic'");
    expect(scripts).not.toContain("'unsafe-inline'");
    expect(scripts).not.toContain("'unsafe-eval'");
  });

  it("allows eval in development only", () => {
    expect(directive(buildCsp({ nonce: "N", supabaseUrl: SUPABASE, isDev: true }), "script-src")).toContain("'unsafe-eval'");
  });

  it("keeps Google sign-in and Supabase working, and nothing else off our own origin", () => {
    expect(directive(csp, "connect-src")).toEqual(["'self'", SUPABASE, "https://accounts.google.com/gsi/"]);
    expect(directive(csp, "frame-src")).toEqual(["https://accounts.google.com/gsi/"]);
    expect(directive(csp, "style-src")).toContain("https://accounts.google.com/gsi/style");
    expect(directive(csp, "img-src")).toEqual(["'self'", "data:", "blob:"]);
  });

  it("forbids plugins, framing by other sites, and forms or base tags that point elsewhere", () => {
    expect(directive(csp, "object-src")).toEqual(["'none'"]);
    expect(directive(csp, "frame-ancestors")).toEqual(["'none'"]);
    expect(directive(csp, "base-uri")).toEqual(["'self'"]);
    expect(directive(csp, "form-action")).toEqual(["'self'"]);
  });

  it("upgrades insecure requests in production, not on a local development server", () => {
    expect(csp).toContain("upgrade-insecure-requests");
    expect(buildCsp({ nonce: "N", supabaseUrl: SUPABASE, isDev: true })).not.toContain("upgrade-insecure-requests");
  });

  it("copes with a missing Supabase address instead of producing a broken policy", () => {
    expect(directive(buildCsp({ nonce: "N", supabaseUrl: "" }), "connect-src")).toEqual([
      "'self'",
      "https://accounts.google.com/gsi/",
    ]);
  });
});

describe("newNonce", () => {
  it("is different every time and safe to put in a header", () => {
    const a = newNonce();
    expect(a).not.toBe(newNonce());
    expect(a).toMatch(/^[A-Za-z0-9+/=]+$/);
  });
});
