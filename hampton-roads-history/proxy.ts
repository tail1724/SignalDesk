import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Our own API routes get the strict CSP treatment. Payload's admin UI
// (/admin) and its own REST/GraphQL surface (/api/graphql*, and the
// catch-all /api/[...slug] for anything not in this list) ship inline
// scripts and bundling patterns we don't control, so they're excluded
// rather than risk breaking the CMS with a policy it wasn't built for.
const OWN_API_PREFIXES = [
  "/api/newsletter",
  "/api/events",
  "/api/weather",
  "/api/ads",
  "/api/auth",
  "/api/watchlist",
  "/api/breaking",
  "/api/revalidate",
  "/api/images",
  "/api/health",
  "/api/search",
  "/api/og",
];

function isOwnRoute(pathname: string): boolean {
  if (pathname.startsWith("/admin")) return false;
  if (pathname.startsWith("/api/graphql")) return false;
  if (pathname.startsWith("/api/")) {
    return OWN_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  }
  return true;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionResponse = await updateSession(request);

  if (!isOwnRoute(pathname)) {
    return sessionResponse;
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""};
    style-src 'self' ${isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`};
    img-src 'self' blob: data: https://odogjtrpcpqicgqaraih.supabase.co;
    font-src 'self' data:;
    connect-src 'self' https://odogjtrpcpqicgqaraih.supabase.co wss://odogjtrpcpqicgqaraih.supabase.co;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeader);

  // A/B variant assignment (WS-15's ConversionBand experiment). Assigned
  // once per visitor and stuck to for a year. Patched into the forwarded
  // Cookie header (not just the outgoing Set-Cookie) so this exact request
  // sees it via cookies() immediately — a plain Set-Cookie only takes
  // effect starting the browser's *next* request.
  let abVariant = request.cookies.get("ab_variant")?.value;
  const isNewAbVariant = abVariant !== "a" && abVariant !== "b";
  if (isNewAbVariant) {
    abVariant = Math.random() < 0.5 ? "a" : "b";
    const existingCookie = requestHeaders.get("cookie") ?? "";
    requestHeaders.set(
      "cookie",
      existingCookie ? `${existingCookie}; ab_variant=${abVariant}` : `ab_variant=${abVariant}`
    );
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Carry over any cookies updateSession() already queued (auth refresh)
  sessionResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie);
  });

  response.headers.set("Content-Security-Policy", cspHeader);

  if (isNewAbVariant) {
    response.cookies.set("ab_variant", abVariant!, {
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp).*)",
  ],
};
