/**
 * What the journal shows before anything else (ADR-0011, ADR-0013): setup is
 * required at the next sign-in, and so is finishing the move of old content, so
 * the app has no lasting mixed mode. Pure, so the rule is tested without a browser.
 */
export type GateScreen =
  | "open" // the page itself
  | "wait" // the device's storage is still being read
  | "setup" // no keys yet: set up encryption first
  | "unlock" // old content is waiting and this device has no key
  | "move"; // old content is waiting and this device can encrypt it

export function gateScreen(args: {
  pathname: string;
  status: "loading" | "off" | "locked" | "unlocked";
  /** Rows with readable text and no ciphertext, according to the server. */
  unmoved: number;
  /** A run has just finished on this device, so the page opens while the server's counts catch up. */
  moved: boolean;
}): GateScreen {
  const { pathname, status, unmoved, moved } = args;
  // Public pages are not the journal, and Settings stays reachable so a person can still delete their account.
  if (!pathname.startsWith("/app") || pathname.startsWith("/app/settings")) return "open";
  if (status === "loading") return "wait";
  if (status === "off") return "setup";
  if (unmoved > 0 && !moved) return status === "locked" ? "unlock" : "move";
  return "open";
}
