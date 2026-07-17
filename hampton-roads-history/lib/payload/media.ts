import type { Payload } from "payload";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);
const MAX_BYTES = 10 * 1024 * 1024; // matches app/api/images/upload's existing cap
const FETCH_TIMEOUT_MS = 8_000;

export type IncomingMedia = {
  url: string;
  alt: string;
  credit?: string;
  rights: "owned" | "licensed" | "review";
};

function extensionFor(mimeType: string): string {
  const ext = mimeType.split("/")[1] || "bin";
  return ext === "jpeg" ? "jpg" : ext;
}

// Copies a remote, already rights-cleared ("owned" | "licensed") media item
// into the hr_media collection server-side, so an ingested article's hero
// image is a real Payload upload rather than a foreign URL the newsroom
// doesn't control. Caller must have already filtered out rights:"review"
// items — this function does not itself gate on rights.
//
// Trust note: the URL originates from an HMAC-authenticated integration
// partner (verified before this is ever called), not an arbitrary public
// request, which is why this doesn't attempt full SSRF hardening beyond an
// https-only scheme check, a size cap, and a mime allowlist.
export async function copyRemoteMediaToHrMedia(
  payload: Payload,
  media: IncomingMedia
): Promise<string | null> {
  let parsed: URL;
  try {
    parsed = new URL(media.url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(parsed, { signal: controller.signal });
    if (!res.ok) return null;

    const mimeType = res.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
    if (!mimeType || !ALLOWED_MIME_TYPES.has(mimeType)) return null;

    const contentLength = res.headers.get("content-length");
    if (contentLength && Number(contentLength) > MAX_BYTES) return null;

    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_BYTES) return null;

    const buffer = Buffer.from(arrayBuffer);
    const filename = `ingested-${Date.now()}.${extensionFor(mimeType)}`;

    const created = await payload.create({
      collection: "hr_media",
      overrideAccess: true,
      data: {
        alt: media.alt || "Untitled image",
        credit: media.credit,
      },
      file: {
        data: buffer,
        mimetype: mimeType,
        name: filename,
        size: buffer.byteLength,
      },
    });

    return String(created.id);
  } catch (error) {
    payload.logger.error({ error, url: media.url }, "Failed to copy remote media into hr_media");
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export function computeRightsStatus(media: IncomingMedia[] | undefined | null): "clear" | "pending_review" | "none" {
  if (!media || media.length === 0) return "none";
  return media.some((item) => item.rights === "review") ? "pending_review" : "clear";
}
