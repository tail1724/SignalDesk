#!/usr/bin/env bash
# Convert a source image into the optimized VaporNet hero art and place it
# where the frontend expects it. Re-run any time the artwork changes
# (e.g. when commissioned, region-accurate Hampton Roads art replaces the
# placeholder). See docs/vapornet-pixel-perfect-plan.md and
# public/vapornet/README.md.
#
# Usage:
#   scripts/set-hero-art.sh /path/to/your-image.png
#
# Picks the best available encoder (cwebp → ffmpeg → sharp via npx),
# resizes to ~2200px wide, targets quality 80 (well under the 500 KB budget).
set -euo pipefail

SRC="${1:-}"
if [[ -z "$SRC" || ! -f "$SRC" ]]; then
  echo "Usage: scripts/set-hero-art.sh /path/to/your-image.(png|jpg|webp)" >&2
  exit 1
fi

# Resolve to repo-relative output regardless of where this is invoked from.
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$HERE/public/vapornet/americana-city-inspiration.webp"
mkdir -p "$(dirname "$OUT")"

WIDTH=2200
QUALITY=80

if command -v cwebp >/dev/null 2>&1; then
  cwebp -q "$QUALITY" -resize "$WIDTH" 0 "$SRC" -o "$OUT"
elif command -v ffmpeg >/dev/null 2>&1; then
  ffmpeg -y -i "$SRC" -vf "scale=${WIDTH}:-1" -q:v 5 "$OUT"
else
  echo "Using npx sharp-cli (no cwebp/ffmpeg found)…"
  npx --yes sharp-cli --input "$SRC" --output "$OUT" resize "$WIDTH" -- webp --quality "$QUALITY"
fi

SIZE_KB=$(( $(wc -c < "$OUT") / 1024 ))
echo "Wrote $OUT (${SIZE_KB} KB)"
if (( SIZE_KB > 500 )); then
  echo "WARNING: ${SIZE_KB} KB exceeds the 500 KB hero budget — lower QUALITY or WIDTH." >&2
fi

echo
echo "Next:"
echo "  git add public/vapornet/americana-city-inspiration.webp"
echo "  git commit -m 'feat(frontend): add VaporNet hero art' && git push"
