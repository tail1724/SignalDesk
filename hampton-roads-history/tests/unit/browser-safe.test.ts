import { describe, expect, it, vi } from "vitest";
import { createBrowserId, safeSessionGet, safeSessionSet } from "@/lib/browserSafe";

describe("browserSafe", () => {
  it("falls back when crypto.randomUUID is unavailable", () => {
    const originalCrypto = globalThis.crypto;
    vi.stubGlobal("crypto", { getRandomValues: (bytes: Uint8Array) => bytes.fill(1) });

    expect(createBrowserId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);

    vi.stubGlobal("crypto", originalCrypto);
  });

  it("treats throwing sessionStorage as unavailable", () => {
    const originalWindow = globalThis.window;
    vi.stubGlobal("window", {});
    vi.stubGlobal("sessionStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    });

    expect(safeSessionGet("x")).toBeNull();
    expect(() => safeSessionSet("x", "y")).not.toThrow();

    vi.stubGlobal("window", originalWindow);
  });
});
