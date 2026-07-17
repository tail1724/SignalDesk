# VaporNet Americana redesign package

Production-design handoff for the expanded Hampton Roads publication, Hunt's
Pointe drafting workflow, and SignalDesk/Payload control plane.

## Open the deliverables

- `index.html` — interactive responsive mockups.
- `design-blueprint.html` — engineering, design, advertising, governance, and
  verification plan.
- `styles.css` and `prototype.js` — readable prototype source.
- `assets/americana-city-inspiration.webp` — an optimized prototype derivative
  of the user-supplied art-direction reference. The original PNG is retained for
  handoff. Replace both with commissioned, region-accurate Hampton Roads artwork
  before production.
- `verify.cjs` — deterministic interaction and publishing-boundary checks.
- `VERIFICATION.md` — Build Loop evidence and the remaining production visual
  gate.

The files have no external runtime dependencies. Open `index.html` directly, or
serve the directory locally:

```bash
python3 -m http.server 4173 --directory .
```

Then visit `http://localhost:4173/`.

For the prototype verification harness, install `jsdom` into a disposable test
directory and run `verify.cjs`. The production repositories keep their own test
and Build Loop commands in `design-blueprint.html`.

## Prototype controls

- Switch among Home, Section, Article, Hunt's Pointe, and Payload.
- Toggle desktop/mobile composition.
- Toggle day/night palette and reduced motion.
- Change Ad load from Standard to Revenue. Revenue mode demonstrates the one
  additional eligible slot allowed on sufficiently long pages; it does not
  represent unconditional ad serving.
- Run the Hunt's Pointe “Send to SignalDesk” preflight and follow the resulting
  review draft into the Payload dashboard.
- Open the privacy/ad-choice center from any publication surface.

## Product decisions represented

- Hampton Roads expands into news, business, culture, history, defense/port,
  and civic life.
- “Hampton Roads” is a working master-brand treatment. “History” becomes a
  vertical. Final naming and the “America begins at the water” campaign line
  remain approval gates.
- Viewability is the one Money Path term this redesign drives. Net revenue,
  retention, Core Web Vitals, accessibility, and trust are guardrails.
- Hunt's Pointe only creates unpublished review drafts. Human approval in
  Payload remains mandatory.
- Consent, retention, RBAC, advertiser separation, creative scanning, audit
  logs, ads.txt, and sellers.json are launch requirements.

## Important boundary

This is a deterministic interaction-verified design prototype and implementation
specification, not a patch to either production repository. Engineering should
run the visual/device matrix in its normal local and staging browsers, then
implement through the phased Build Loop in `design-blueprint.html`, preserving
the existing Next.js 16, Payload 3, Supabase, DigitalOcean, and Hunt's Pointe
architecture.
