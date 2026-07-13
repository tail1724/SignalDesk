# Hampton Roads History — MVP Redesign Plan

**Prepared by:** VP of Design
**For:** VP of Engineering
**Status:** Ready for implementation
**Companion artifact:** [`redesign/mockup.html`](./mockup.html) — self-contained, interactive HTML mockup (open in any browser; includes home feed, Smart Brevity article, city page, advertise/legal copy, and the working theme switcher)

---

## 1. Executive summary

The current product works, but it presents as a dense, dark-mode hobbyist archive. The redesign repositions Hampton Roads History as a high-velocity local news product in the mold of Axios Local, while retaining the brand's terracotta identity and its seven-city structure.

Five non-negotiable outcomes:

1. **Aesthetic inversion.** Light mode becomes the default. Stark white canvas, high-contrast near-black text, modern sans-serif type, generous negative space. The archival dark palette is retained only as the optional dark theme.
2. **Theme switcher.** A light/dark switcher lives in site settings (and as a quick toggle in the header). Preference persists across visits and syncs to the account where signed in.
3. **Single-column linear feed.** The multi-column bento grid, persistent sidebars, and sticky sub-navigation are removed from the primary reading path. One prioritized, curated vertical feed.
4. **Smart Brevity article format.** Bold lede, bolded axioms ("Why it matters:", "Driving the news:", "What's next:"), bullet-point reporting, 1–2 minute read targets.
5. **Third-party ad monetization.** Hampton Roads History **will use third-party ad networks to monetize.** All first-party-only / "no third-party ads" claims are removed from the Advertise, Ad Choices, Privacy, Terms, and About pages and replaced with accurate third-party disclosure language. Native sponsored units are injected inline in the feed.

---

## 2. Design principles

| Principle | What it means in practice |
|---|---|
| Clinical clarity | White canvas, hairline dividers, no decorative chrome between the reader and the headline. |
| Reader's time first | Every story consumable in 1–2 minutes; axiom + bullets, never walls of prose. |
| One column, one priority | The feed is a single ranked stream. Curation replaces navigation. |
| Inbox over destination | Newsletter capture is the primary conversion event, injected into the scroll path. |
| Brand continuity | Terracotta (`#C0472F` family) survives as the single accent. The comic-book cityscape illustration style (see §7) becomes the masthead/brand illustration language — not the UI language. |

---

## 3. Design tokens

Replace the current token block in `hampton-roads-history/app/globals.css`. Light is `:root` default; dark is applied via `[data-theme="dark"]` on `<html>`.

### Light (default)

```css
:root {
  --base: #ffffff;
  --surface-1: #ffffff;
  --surface-2: #f7f6f3;
  --surface-3: #efede8;
  --line: #e7e4dd;
  --line-strong: #d5d1c6;

  --ink: #15140f;      /* headlines, body */
  --ink-2: #4c4a42;    /* secondary text */
  --ink-3: #8b877b;    /* metadata, kickers */

  --accent: #c0472f;   /* unchanged brand terracotta */
  --accent-dim: #9c3a26;
  --accent-soft: #f3ddd4;

  --accent-blue: #2f6577; /* cool counterpoint, links-on-hover, data */
}
```

### Dark (opt-in via switcher)

Reuse the existing dark tokens verbatim under `[data-theme="dark"]`. The current palette is good; it just stops being the default.

### Typography

- **Kill the display serif and the mono kickers in the reading path.** Single sans family for everything: `Inter` (self-hosted, `next/font/local` or `next/font/google` with `display: swap`), fallback `-apple-system, "Segoe UI", Roboto, sans-serif`.
- Scale: 15px meta / 17px body (1.6 line-height) / 22px feed headline (700) / 34px article H1 (800, -0.02em tracking).
- Mono is retained **only** for the weather widget and timestamps if desired — never for headlines or kickers.

---

## 4. Information architecture & page-by-page spec

### 4.1 Global navigation — `components/GlobalNav.tsx`

- Slim (56px) sticky white header, hairline bottom border.
- Left: wordmark. Center: seven city links (overflow into a "Cities" menu < 1024px). Right: search (`⌘K` retained), theme quick-toggle (sun/moon), **Subscribe** as the single filled accent button, Sign in as text link.
- Remove: `SectionPills.tsx` sticky sub-nav from the home path (keep the component for city pages only if analytics justify; default is delete).

### 4.2 Home — `app/(frontend)/page.tsx`

Replace `HeroBentoGrid.tsx` + `rail/*` composition with a **single 680px-max column**, in this order:

1. **Top story block** — kicker, 34px headline, one-sentence lede, "Why it matters" one-liner, byline/read-time.
2. **Newsletter capture band #1** (The Morning Dispatch) — full-width-of-column inline card, email input + one button. This is the primary conversion unit; it appears above the fold on desktop.
3. **Ranked story feed** — `ArticleCard.tsx` rewritten: no thumbnail-left dark card; instead kicker (city · topic, accent color, 12px caps), 22px headline, 1-sentence summary, meta row. Hairline between cards, 32px vertical rhythm.
4. **Inline sponsored unit** after feed position 3 (see §6) and every ~6 items thereafter.
5. **Newsletter capture band #2** at feed position ~8.
6. Photojournalism: cards may carry a full-column-width 16:9 photo **only when a real photograph exists**. No gradient placeholder blocks in the new system — a card with no photo renders text-only.

Sidebars (`TrendingArticles`, weather, reading list, browse-by-city) are removed from home. Weather collapses into a one-line chip in the header area of the feed ("84° Partly cloudy · Hampton Roads"). Trending becomes an editorial "Catch up fast" bulleted card inside the feed (position ~5).

### 4.3 Article page — `app/(frontend)/[city]/[idSlug]/page.tsx`, `components/ArticleBody.tsx`

Smart Brevity template, enforced by structure not by convention:

- Kicker → H1 (34px) → one-paragraph bold lede (19px).
- Modular blocks rendered from CMS fields: **Why it matters**, **Driving the news**, **By the numbers**, **What's next**, **Go deeper** — each a bolded axiom followed by bullets. Payload CMS: add a `brevityBlocks` array field (blockType enum + rich-text bullets) to the Articles collection; `ArticleBody.tsx` maps blocks to components.
- Photo (when real) sits between lede and first axiom, full column width, credit line required.
- Read-time target surfaced in editor UI; warn > 2 min.
- Below article: one third-party ad slot, then "More from {city}" as three text-only links, then newsletter band.
- `ShareBar`/`WatchlistToggle` collapse into a single quiet meta row under the byline.

### 4.4 City pages — `app/(frontend)/[city]/page.tsx`

Same single-column feed as home, filtered by city. City name as H1 with one-line description; city switcher becomes a horizontal row of text tabs (light style) under the header. **This spec applies identically to all seven city pages.**

### 4.5 Search, Sign in, Account, Saved

- `search/`: full-width centered input on white, results as the standard feed card.
- `auth/`, `account/`, `watch/`: restyle to light tokens; forms use 44px inputs, single accent button. Sign-in page drops the "Your reading list" second column — single centered card.
- **Settings (account page): add "Appearance" section** — radio: Light / Dark / System. This is the canonical home of the theme switcher (header toggle is a shortcut to the same preference).
- Saved stories remains, but page copy repositions it as secondary to the newsletter ("Get tomorrow's stories delivered instead →" cross-sell).

### 4.6 Newsletter — `app/(frontend)/newsletter/*`, `ConversionBand*.tsx`

- `ConversionBand` is promoted to the workhorse component: inline-in-feed variant, article-footer variant, and exit-intent-free (no popups — inline only).
- Success state confirms inline without navigation.

---

## 5. Theme switcher — implementation spec

- `<html data-theme="light|dark">`, set pre-hydration by an inline script in `app/(frontend)/layout.tsx` reading `localStorage.hrh-theme` → falls back to `prefers-color-scheme` when preference is "system".
- React context `ThemeProvider` (or `next-themes`, MIT, 3KB — recommended) exposes `setTheme`.
- Persist: `localStorage` + (when signed in) a `theme` column on the Supabase profile so preference roams.
- Quick toggle in `GlobalNav`; full control (Light/Dark/System) in Account → Appearance.
- All components must consume tokens only — audit for hardcoded dark hexes (`rg '#1[29]1' components app`).
- `color-scheme: light dark` on `:root` for native form controls; no FOUC (inline script runs before paint).

---

## 6. Monetization: third-party advertising

**Positioning change: Hampton Roads History will use third-party ad networks to monetize.** Remove every claim to the contrary.

### 6.1 Copy changes (exact files)

| File | Change |
|---|---|
| `app/(frontend)/advertise/page.tsx` | Remove "no third-party ad networks, no tracking scripts." New copy: direct-sold **and** programmatic third-party placements; sponsored content in-feed; contact for rate card. |
| `app/(frontend)/(legal)/ad-choices/page.tsx` | Rewrite: we work with third-party ad networks and real-time bidding partners; ads may be personalized; link to opt-out mechanisms (NAI/DAA, TCF/GPP consent manager); sponsored-content labeling policy stays. |
| `app/(frontend)/(legal)/privacy/page.tsx` | Remove "We don't run third-party ad networks…" Add: third-party advertising partners, cookies/identifiers for ad delivery and measurement, consent management, links to partner policies. |
| `app/(frontend)/(legal)/terms/page.tsx` | Add an "Advertising" section stating the Site displays third-party advertising and sponsored content. |
| `app/(frontend)/about/page.tsx` | Remove "We don't run third-party ad networks or trackers" sentence; state that advertising (including third-party) funds the journalism. |
| `docs/ROADMAP.html` | Delete/supersede the "zero third-party scripts" and "first-party only" workstream lines (WS-10/WS-11 notes). |

### 6.2 Ad stack

- **Serving:** Google Ad Manager + **Prebid.js/Prebid Server** header bidding (OpenRTB), server-side where possible to protect Core Web Vitals.
- **`components/AdSlot.tsx`** becomes a dual-mode component: `mode="native"` (existing first-party direct-sold JSON pipeline — keep it, it's now the "direct-sold" tier) and `mode="programmatic"` (GPT slot with Prebid wrapper, lazy-loaded at 200% viewport margin, fixed aspect-ratio reserved to hold CLS at 0).
- **Placements:** in-feed native sponsored card after position 3 and every 6th item; one 300×250/fluid below each article; anchor slot on mobile. Every unit labeled **"Sponsored"** or **"Advertisement"** — the labeling honesty policy is retained even as the stack changes.
- **Consent:** CMP (TCF 2.2 + GPP) gate before any third-party script fires; CSP updated from "block all third-party" to an explicit allowlist; ads.txt published; ads.cert/sellers.json validation on partners.
- **Quality:** creatives sandboxed in SafeFrame; existing anomalous-click monitoring extends to programmatic impressions.

---

## 7. Brand illustration system (cityscape inspiration)

The pop-art cityscape reference does **not** become the UI — the UI is clinical white. It becomes the **brand illustration layer**:

- A halftone, ink-outlined Hampton Roads skyline strip (harbor cranes, Fort Monroe, the bridge-tunnel) used in: masthead flourish (24px strip under the wordmark on home only), newsletter header art, empty states, and the About page.
- Warm palette (terracotta/brick/taxi-yellow) for foreground/community subjects; cool blues for skyline/data — mirroring the reference's warm-street/cool-sky dichotomy.
- Delivered as static SVG in MVP. A Three.js/WebGPU interactive version is explicitly **out of scope for MVP** (tracked as a post-launch brand moment; do not let it block this ship).

---

## 8. Engineering workplan

| Phase | Scope | Est. |
|---|---|---|
| 1. Tokens & theme | New light tokens, `data-theme` infra, switcher (header + settings), hardcoded-color audit | 3–4 d |
| 2. Shell | GlobalNav, Footer, kill SectionPills on home | 2 d |
| 3. Feed | Home + city single-column feed, ArticleCard rewrite, ConversionBand variants, weather chip | 4–5 d |
| 4. Article | Smart Brevity blocks (Payload schema + ArticleBody renderer), meta row | 4 d |
| 5. Monetization | Copy changes (§6.1), AdSlot dual-mode, GPT+Prebid, CMP, CSP/ads.txt | 5–6 d |
| 6. Secondary pages | Search, auth, account (Appearance), saved, newsletter, legal restyle | 3 d |
| 7. QA & launch | Visual regression (Playwright), CWV budget (LCP <2.0s, CLS <0.02, INP <200ms), a11y AA audit both themes | 3 d |

Dependencies: Phase 1 blocks everything; Phase 5 CMP must land before any programmatic script ships.

## 9. Success metrics

- Newsletter signup conversion ≥ 2.5% of sessions (primary KPI).
- Median session read completion up 20% (brevity format).
- Programmatic + direct ad revenue live with CLS ≤ 0.02 on ad-bearing pages.
- Theme switcher adoption tracked; zero contrast violations (WCAG AA) in both themes.
