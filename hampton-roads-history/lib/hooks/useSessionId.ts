import { hasResolvedConsent } from "@/lib/consent";
import { createBrowserId, safeSessionGet, safeSessionSet } from "@/lib/browserSafe";

const SESSION_KEY = "hr_session_id";

// Shared across every client-side beacon (page events, ad impressions) so
// they attribute to the same session. sessionStorage, not localStorage —
// scoped to the tab/visit, matching how the anonymous analytics session is
// meant to be a "visit", not a durable device identity.
//
// Returns null before consent is resolved: this session id is nonessential
// storage under the Epic G consent gate, so it must not be created (and
// nothing that depends on it — ad requests, event beacons — may fire) until
// the reader has accepted or gone essential-only.
export function getOrCreateSessionId(): string | null {
  if (typeof window === "undefined") return null;
  if (!hasResolvedConsent()) return null;
  let id = safeSessionGet(SESSION_KEY);
  if (!id) {
    id = createBrowserId();
    safeSessionSet(SESSION_KEY, id);
  }
  return id;
}
