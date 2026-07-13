const SESSION_KEY = "hr_session_id";

// Shared across every client-side beacon (page events, ad impressions) so
// they attribute to the same session. sessionStorage, not localStorage —
// scoped to the tab/visit, matching how the anonymous analytics session is
// meant to be a "visit", not a durable device identity.
export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "server";
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}
