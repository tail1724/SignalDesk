# Handoff notes for this copy of the package

This directory was committed from files attached directly to a Claude Code
session (not the full original zip), across two drops. `verify.cjs` and
`VERIFICATION.md` are now present. One thing called out in `README.md` is
still **not** included:

- `assets/americana-city-inspiration.webp` (and the retained source PNG) —
  the hero art-direction reference. A version of this artwork was pasted
  inline in the session chat twice (comic-style Americana city street scene,
  brownstones with a Manhattan skyline including the Twin Towers) but both
  times arrived as a rendered image with no accessible file path, so it
  could not be extracted to disk byte-for-byte — pasted images don't land
  under `/root/.claude/uploads/...` the way `@file` attachments do. Until
  the actual file is attached (via the upload/attach control, not paste)
  and committed here, production code (`components/three/StoryWorldPoster.tsx`)
  uses the prototype's CSS gradient/orbit treatment (`.hero-art`,
  `.hero-shade`, `.hero-gridlines`, `.hero-orbit` in `styles.css`) as the
  hero background, with no photographic layer. `verify.cjs` line 117 checks
  this file's size against a 500KB budget — that assertion can't be run
  until the file exists.

If/when the real webp is attached, drop it at
`assets/americana-city-inspiration.webp` here, copy it to
`hampton-roads-history/public/brand/americana-city-inspiration.webp`, and
pass `posterSrc="/brand/americana-city-inspiration.webp"` into
`StoryWorldPoster` from `CivicHero`.
