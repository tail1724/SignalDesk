// Defensive browser-only helpers for APIs that are missing or can throw in
// older/mobile WebViews. Analytics and ad code should never take down the
// reader-facing page just because storage or Web Crypto is unavailable.

export function createBrowserId(): string {
  const randomUUID = globalThis.crypto?.randomUUID;
  if (typeof randomUUID === "function") return randomUUID.call(globalThis.crypto);

  const bytes = new Uint8Array(16);
  const getRandomValues = globalThis.crypto?.getRandomValues;
  if (typeof getRandomValues === "function") {
    getRandomValues.call(globalThis.crypto, bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }

  // RFC 4122 version 4 / variant bits. This fallback is for browser support,
  // not identity strength; it is still only used for anonymous per-visit IDs.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
}

export function safeSessionGet(key: string): string | null {
  try {
    return typeof window === "undefined" ? null : sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSessionSet(key: string, value: string): void {
  try {
    if (typeof window !== "undefined") sessionStorage.setItem(key, value);
  } catch {
    // Storage may be unavailable in private browsing or embedded browsers.
  }
}
