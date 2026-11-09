import { describe, expect, it } from "vitest";
import { gateScreen } from "@/lib/crypto/gate";

const base = { pathname: "/app", unmoved: 0, moved: false } as const;

describe("gateScreen", () => {
  it("requires setup before the journal when the account has no keys, new or old", () => {
    expect(gateScreen({ ...base, status: "off" })).toBe("setup");
    expect(gateScreen({ ...base, status: "off", unmoved: 40 })).toBe("setup");
    expect(gateScreen({ ...base, status: "off", pathname: "/app/categories" })).toBe("setup");
  });

  it("keeps Settings and the public pages open, so an account can still be deleted", () => {
    for (const pathname of ["/app/settings", "/about", "/privacy", "/"]) {
      expect(gateScreen({ ...base, pathname, status: "off", unmoved: 10 })).toBe("open");
    }
  });

  it("asks for the password when old content is waiting and this device has no key", () => {
    expect(gateScreen({ ...base, status: "locked", unmoved: 3 })).toBe("unlock");
  });

  it("moves old content on an unlocked device, and opens once it is moved", () => {
    expect(gateScreen({ ...base, status: "unlocked", unmoved: 3 })).toBe("move");
    expect(gateScreen({ ...base, status: "unlocked", unmoved: 3, moved: true })).toBe("open");
    expect(gateScreen({ ...base, status: "unlocked", unmoved: 0 })).toBe("open");
  });

  it("lets a locked device browse when nothing is waiting to be moved", () => {
    expect(gateScreen({ ...base, status: "locked", unmoved: 0 })).toBe("open");
  });

  it("waits while the device's storage is still being read", () => {
    expect(gateScreen({ ...base, status: "loading", unmoved: 5 })).toBe("wait");
  });
});
