# VaporNet pixel-perfect frontend plan

**Scope:** the public Hampton Roads surfaces in `hampton-roads-history` — Home, Article, City edition, plus global chrome (top strip, masthead, section nav, breaking ribbon, footer, ad frames).
**Reference:** the six approved design screenshots (masthead/hero, home ×2, article ×2, city edition) and the interactive prototype they were rendered from: `redesign/vapornet/index.html` + `redesign/vapornet/styles.css`. The prototype is the machine-readable source of truth; the screenshots are the acceptance record.
**Non-scope:** Payload Admin (Quantum Newsroom, already shipped), Hunt's Pointe, ad-decision logic, content model.

---

## 1. Why the current build doesn't match

The tokens are already correct — `app/globals.css` carries the verbatim VaporNet primitives. The drift comes from four specific places, in order of visual damage:

1. **Font substitution.** The prototype (and therefore every reference screenshot) renders its display face from the local stack `"Iowan Old Style", Baskerville, "Times New Roman"` — i.e., the screenshots show **Iowan Old Style, a macOS system font**. Production renders **Newsreader** via `next/font`. The two faces have different weight distribution at 900, different x-height, different tracking response, and different line-box metrics — every headline, and therefore every block below a headline, lands in a different place. No amount of spacing work fixes this while the faces differ.
2. **Re-derived styling.** Components were restyled through Tailwind semantic utilities that *approximate* the prototype instead of copying it. The prototype's signature geometry is precise and non-standard: asymmetric corner radii (`.hero-brief` = `3px 22px 3px 22px`, `.data-card` = `2px 16px 2px 16px`), micro mono labels at **7–9px** with `.1em` tracking (`.ad-meta` is `font: 7px var(--mono)` on a **25px** rail), exact grid fractions (`.cinematic-hero` = `minmax(0,1.45fr) minmax(260px,.55fr)` at `min-height:610px`), exact chrome heights (`.section-nav` 39px, `.breaking-ribbon` 40px), tinted ad frames (`border:#cdc7ba; background:#f4f0e7; radius:10px`). Tailwind's nearest steps are visibly wrong at this density.
3. **DOM drift.** Component markup doesn't mirror the prototype's structure (wrapper counts, label rows, rules, stamps), so even correct CSS can't land identically.
4. **No enforcement.** There is no visual-regression gate comparing production against the prototype, so every change drifts a little further.

**Decision that follows:** stop re-deriving. Port the prototype CSS verbatim, make components emit the prototype DOM, pin one deterministic font set on both sides, and hold the result with per-module screenshot diffs in CI.

---

## 2. What "pixel perfect" means here (and one honest caveat)

**Definition:** at four fixed viewports — 390×844, 768×1024, 1440×900, 1920×1080 — in day and night themes, a screenshot of each production module differs from the same module in the reference build by **≤0.1% of pixels** (module-level) and **≤0.5%** (full page), measured by Playwright `toHaveScreenshot` with anti-aliasing tolerance enabled.

**The caveat, stated plainly:** Iowan Old Style is an Apple system font and cannot legally be self-hosted on the web. The screenshots' exact glyphs are therefore not shippable. The blueprint (§03 Typography) already anticipated this: production display face is **Newsreader (self-hosted, variable, already integrated)** or **Source Serif 4**. So the plan defines pixel-perfection against a **patched reference build**: the prototype with its font stack switched to the exact same self-hosted files production uses. Both sides then render identical glyphs on CI's Linux runners, and every other property — color, spacing, geometry, borders, radii, hierarchy — is matched exactly. Phase 1 includes a one-page type specimen (Newsreader vs Source Serif 4 at 900/tight-tracking against the screenshots) so the final face is a reviewed decision, not a default.

---

## 3. Phase 1 — Deterministic typography (the foundation)

1. **Pick the display face** from the specimen page (`/design/type-specimen`, dev-only): render the hero headline, section heads, article display, and briefing labels in Newsreader 900 and Source Serif 4 900 side by side with the screenshot crops. One reviewer decision, recorded in this doc.
2. **Pin the full set via `next/font`** (already partially done): serif display (chosen face, weights 400–900 + italic), Inter for interface sans, JetBrains Mono for micro labels. `display: "swap"` in production but **`display: "block"` under the visual-test env flag** so screenshots never capture fallback glyphs.
3. **Patch the reference build:** a small script copies `redesign/vapornet/` into `tests/visual/reference/` and rewrites its `--serif/--sans/--mono` stacks to `@font-face` rules pointing at the same font files production serves. This patched copy — never the raw prototype — is the baseline generator.
4. **Normalize rendering:** identical `-webkit-font-smoothing`, `text-rendering`, and `font-synthesis: none` on both sides so Linux/Chromium rasterizes identically.

## 4. Phase 2 — Verbatim CSS port (the "no re-derivation" rule)

1. Extract the public-surface sections of `redesign/vapornet/styles.css` (everything except the `admin-*` mock and prototype-shell controls) into **`app/(frontend)/vapornet.css`**, imported by the frontend layout. Class names are kept **byte-identical** to the prototype. This file is generated-then-frozen: a comment header names the source and forbids hand-tuned values that deviate from it.
2. **Cascade strategy (important with Tailwind v4):** `globals.css` uses `@import "tailwindcss"`, which places all Tailwind styles in cascade layers. `vapornet.css` stays **unlayered**, so it beats Tailwind's layered utilities and preflight by cascade rule, no `!important` needed. Tailwind remains for auth/account/search interactivity and anything the prototype doesn't specify.
3. **Night mode:** port the prototype's `.night-mode` override block and bridge it to the existing theme system with a compound selector (`[data-theme="dark"]`, `.night-mode`) so `ThemeToggle`/persistence keep working unchanged.
4. Port `.density-revenue` (revenue placement variant) and the reduced-motion block as-is — both are already product behavior.
5. **Then delete** the approximated utility styling from the affected components as each one is converted (Phase 3), never before — the site must stay shippable at every commit.

## 5. Phase 3 — Surface-by-surface conversion

Rule for every module: open the prototype section in `index.html`, copy its DOM structure into the component (JSX-ized, same classes, same element order, same wrapper count), delete the component's bespoke styling, verify against the fixture diff (Phase 4). Mapping of the six screenshots:

### 5.1 Global chrome (screenshot A — masthead/hero)
| Module | Prototype classes | Production component |
|---|---|---|
| Live desk strip (LIVE DESK · date · region · temp · privacy link) | `.top-strip`, `.live-dot` | `GlobalNav` top row |
| Masthead (menu button, serif brand with red "Roads", mono tagline, Find a story ⌘K, Sign in, Join free) | `.masthead`, `.masthead-row`, `.menu-button`, `.masthead-actions` | `GlobalNav` |
| Section nav (Today … Watch, 39px, centered, active red) | `.section-nav` | `GlobalNav` |
| Breaking ribbon (40px signal-red band, DEVELOPING pill, underlined CTA) | `.breaking-ribbon` | `LiveRibbon` / `useBreakingBanner` |
| Footer (navy, brand mark, tagline, link row, contextual-ads chip) | `.footer`, `.footer-mark`, `.consent-chip` | `Footer`, `ConsentChip` |

### 5.2 Home (screenshots 1–2 + hero from A)
- **Cinematic hero:** `.cinematic-hero` (grid `1.45fr/.55fr`, `min-height:610px`, `max-width:1360px`, padding `64px clamp(30px,5vw,78px) 48px`), `.hero-art` + `.hero-shade` + `.hero-gridlines`, kicker eyebrow, display headline, dek, `.hero-actions` (Read the briefing / Listen · 6:12), `.hero-brief` card (numbered `01`, WHY IT MATTERS / WHAT TO WATCH rows split by `.brief-rule`), art-direction mono caption. → `CivicHero` + existing bento/Three fallback poster.
- **Newsletter band:** navy rounded band, gold eyebrow THE MORNING TIDE, serif headline, inline email + red Join free pill. → `NewsletterBand`, `.inline-form`.
- **Leader ad:** `.ad-frame.ad-leader` with `.ad-meta` rail (ADVERTISEMENT / AD CHOICES), HR roundel, PRESENTED BY A REGIONAL PARTNER eyebrow, serif creative line, "Meet the makers" underline link. → `AdFrame` + `DirectSponsor`.
- **Section head:** red mono kicker THE REGION NOW, serif "Reported for where you live", "View the live desk" underline right-aligned, heavy rule below.
- **Lead package:** numbered art card (`02` corner index, `.city-stamp` PORTSMOUTH bottom-right), kicker DEFENSE & PORT · 5 MIN, serif headline, dek, mono byline row.
- **Story grid:** two-up rows split by a vertical hairline; kicker city pairs (BUSINESS · NORFOLK), serif heads, deks, mono meta (`4 min · Prototype story`), topic chips on the civic card (`.compact-card.civic-card`).
- **Partner studio unit:** `.ad-frame.native-ad` — SPONSORED · PARTNER STUDIO rail with WHY THIS AD?, MADE LOCAL navy thumb, eyebrow, serif head, disclosure line, red Explore the series link. → `PartnerStudioCard`.
- **Numbered compact rows** (03/04): red-ringed index circles, kicker/city, serif head, dek, right-aligned mono read time.
- **Catch-up rail:** `.data-card` (radius `2px 16px 2px 16px`, `shadow-sm`) — CATCH UP FAST kicker, "Five minutes. Full context.", numbered hairline list, navy "Play the audio brief" pill. → `CatchUpCard` in `rail/`.
- **Rail ad:** `.ad-frame.rail-ad` navy creative (gold dot, diagonal, REGIONAL PARTNER eyebrow, "Big water. Bold ideas.", underlined Discover link).
- **How we report card:** parchment `.data-card` variant, HOW WE REPORT kicker, standards copy, red underlined link.
- **Cities band:** navy full-bleed `.cities-band` — SEVEN CITIES, ONE REGION kicker, serif "Choose your home view", `.city-cloud` outline chips ×7.

### 5.3 Article (screenshots 3–4)
- **Header:** `.article-header` — kicker row (PROTOTYPE ARTICLE · CIVIC LIFE · NORFOLK), display headline (clamped scale), serif dek, byline row (avatar roundel, name, role · updated · read time) with Save/Share/Listen pill actions right. → `ArticleBody` header + `ShareBar`, `WatchlistToggle`.
- **Hero art:** `.article-hero-art` with mono caption bar under-left and credit under-right.
- **Briefing card:** `.briefing-card` — parchment, **5px signal-red left rail**, THE BRIEFING kicker, serif "What you need to know", label/value hairline rows (Why it matters / The decision / What's next). This is the Smart-Brevity centerpiece; match it exactly.
- **Body rhythm:** `.dropcap` red initial cap, 17–19px serif body on ~68ch measure, serif h2 section heads ("The big picture", "Follow the money").
- **Pull quote:** navy block, rounded asymmetric corners, italic serif quote, mono footnote label.
- **Inline ads:** `.ad-frame.article-inline-ad` (757 roundel variant) with the same 25px `.ad-meta` rail — reserved height before request (CLS zero).
- **Funding chart:** `.data-card` with `.data-title` row + ILLUSTRATIVE ONLY mono tag, `.bar-row` label/track/value rows (navy fill on parchment track).
- **Sources & methodology:** parchment box — SOURCES & METHODOLOGY kicker, serif "How we reported this", bullets, Correction? line.
- **Keep going:** heavy top rule, KEEP GOING kicker, serif head, numbered hairline recirculation rows. → `ArticleCard` compact variant / `article-recirculation`.
- **Article rail:** `.article-rail` — "Track this story" `.data-card` (TRACK THIS STORY kicker, serif head, dek, navy Follow updates pill) + `.ad-frame.extra-ad.article-extra` navy direct sponsor ("Move with confidence."). → `rail/` components, `RailPlacement`.

### 5.4 City edition (screenshot B)
- **City hero band:** rounded navy gradient with gold radial glow, CITY EDITION · 36.8508° N mono eyebrow, serif display "Norfolk", dek, right column: mono "Edition updated 8:42 PM" + white Follow Norfolk pill. → `CityEdition`, `FollowCityButton`.
- **City tabs:** `.city-tabs` chips, active = filled signal-red.
- **Lead package:** `.card-visual` coordinate-grid navy art (`.map-lines`, corner lat/long mono), kicker PROTOTYPE STORY · CIVIC, serif head, dek, mono byline, red underlined "Read the full briefing".
- **At a glance:** parchment `.data-card` — NORFOLK AT A GLANCE kicker, stat rows (`245K residents / 144 neighborhoods / 1 regional story`) with hairlines, disclosure line.
- **Local sponsor band:** `.ad-frame.section-ad` fluid band (serif creative line + Partner message →).
- **City desk:** LATEST FROM NORFOLK kicker, serif "The city desk", "Newest first" right, numbered rows with red-ringed indices, kicker · time, serif heads, deks, right mono read time.
- **Rail:** `.ad-frame.rail-ad` "Made for the coast." navy creative.

## 6. Phase 4 — Fixture routes + visual regression (the enforcement)

1. **Fixture routes** (`app/(frontend)/design/fixtures/{home,article,city}/page.tsx`, non-production only — gated by env or `notFound()` in prod): render the *production components* with the *prototype's exact copy* (headlines, deks, numbers, timestamps hardcoded from `index.html`). Content equality makes pixel diffing meaningful; live pages vary by CMS content and never diff cleanly.
2. **Reference server:** Playwright `webServer` #2 statically serves the patched prototype (Phase 1.3).
3. **Determinism:** freeze `Date` (the strip shows THURSDAY · JULY 16), stub the weather value (84°), `page.emulateMedia({ reducedMotion: "reduce" })`, `animations: "disabled"`, wait on `document.fonts.ready`, disable Three.js canvas in fixtures (static poster path — already a product fallback).
4. **Test matrix:** {home, article, city} × {390, 768, 1440, 1920} × {day, night} × {standard, revenue} — full-page shot + per-module locator shots (masthead, ribbon, hero, newsletter, each ad frame, briefing card, funding card, rails, footer). Module shots are what make failures actionable.
5. **Budgets:** module `maxDiffPixelRatio: 0.001`, full page `0.005`, `threshold: 0.2` for AA tolerance. New Playwright project `visual`; wired into `npm run test:e2e`; CI blocks merge on regression. Updating a baseline requires a PR that changes the reference build too — the prototype stays the source of truth.

## 7. Phase 5 — Live-data hardening

Fixtures prove parity; production content must not break it:

- **Reserved geometry everywhere:** every `.ad-frame` keeps its `min-height` before request (blueprint placement table), images declare aspect ratios, `next/image` with exact sizes — ad-attributed CLS stays ~0.
- **Variable text rules:** headline/dek line-clamps per module (lead package 3 lines, compact rows 2, rail cards 2) so real headlines can't reflow neighbors.
- **State coverage:** empty rail, no-fill ad (frame collapses only pre-paint, per blueprint), missing hero art (coordinate-grid fallback like the city card), long city names in chips.
- Add these states to the module screenshot matrix with fixture variants.

## 8. Sequencing and acceptance

| Step | Deliverable | Gate |
|---|---|---|
| 1. Typography | Face decision recorded; patched reference build; specimen page | Reviewer sign-off vs screenshots |
| 2. CSS port | `vapornet.css` (verbatim), night-mode bridge, cascade verified | Site unchanged visually (no component converted yet); build + e2e green |
| 3a. Global chrome | GlobalNav, ribbon, footer converted | Module diffs ≤0.1% |
| 3b. Home | All §5.2 modules | Module + page diffs pass |
| 3c. Article | All §5.3 modules | Module + page diffs pass |
| 3d. City | All §5.4 modules | Module + page diffs pass |
| 4. Harness in CI | `visual` project blocking | Two consecutive clean CI runs |
| 5. Hardening | State variants + clamps | CLS ≤0.10 p75 lab; state shots pass |

**Done means:** every checklist row in §5 has a passing module diff against the patched reference at all four widths in both themes; `npm run lint && npm test && npm run build && npm run test:e2e` green; no component in the converted surfaces carries a hand-derived color/spacing value that isn't in `vapornet.css`.

## 9. Risks

- **Font honesty (highest):** stakeholders comparing against the macOS screenshots will see different glyphs no matter what. Mitigated by the Phase 1 specimen decision and by regenerating the six reference shots from the patched prototype so future comparisons are apples-to-apples.
- **Tailwind preflight vs ported CSS:** mitigated by the unlayered-CSS cascade strategy (§4.2); verified in step 2's "site unchanged" gate.
- **Screenshot flake on CI:** mitigated by font-block, frozen time, reduced motion, disabled animations, single browser (Chromium) for the visual project.
- **Scope creep into admin:** admin is Quantum Newsroom by decision; this plan touches `(frontend)` only.
