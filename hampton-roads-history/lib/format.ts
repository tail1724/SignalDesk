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
  "from-[#5a3c2e] to-[#2b2f24]",
  "from-[#3a4a3f] to-[#21241c]",
  "from-[#4f7d8c] to-[#21241c]",
  "from-[#8f3624] to-[#2b2318]",
];

export function thumbGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return THUMB_CLASSES[hash % THUMB_CLASSES.length];
}
