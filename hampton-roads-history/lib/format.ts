// Article URLs are /[city]/[short_id]-[slug] — the short_id is looked up by
// exact match (indexed), collision-proof regardless of what the slug part
// says. Returns null for a malformed segment with no leading id.
export function parseShortId(idSlug: string): string | null {
  const [shortId] = idSlug.split("-");
  return shortId || null;
}

export function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

const THUMB_CLASSES = [
  "from-[#0a1d35] to-[#17618b]",
  "from-[#17618b] to-[#0a1d35]",
  "from-[#0a1d35] to-[#ad302a]",
  "from-[#102b4d] to-[#c99a42]",
];

export function thumbGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return THUMB_CLASSES[hash % THUMB_CLASSES.length];
}
