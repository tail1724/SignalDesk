import { test, expect, type Page } from "@playwright/test";

// Pixel-perfect visual regression for the VaporNet public surfaces
// (docs/vapornet-pixel-perfect-plan.md §6). Each fixture route renders the
// real production components with the prototype's exact copy, so the
// screenshots are deterministic and diffable.
//
// Baselines are generated in a build that has the site's real (or a test)
// NEXT_PUBLIC_SUPABASE_* set and the commissioned hero art in
// public/vapornet/, then committed. Run:
//   ALLOW_DESIGN_FIXTURES=1 npm run test:visual -- --update-snapshots
//
// Determinism: reduced motion + disabled animations; relative/server-time
// text (bylines, "updated N minutes ago") is masked because it is rendered
// server-side and cannot be frozen from the browser clock.

const WIDTHS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "laptop", width: 1440, height: 900 },
  { name: "wide", width: 1920, height: 1080 },
];

const THEMES = ["light", "dark"] as const;

const FIXTURES = [
  { name: "home", path: "/design/fixtures/home" },
  { name: "article", path: "/design/fixtures/article" },
  { name: "city", path: "/design/fixtures/city" },
];

// Server-rendered relative timestamps drift with wall-clock time; mask them.
function timeMasks(page: Page) {
  return [
    page.locator(".byline"),
    page.locator(".article-meta span"),
    page.locator(".edition-tools span"),
    page.locator(".row-time"),
    page.locator(".civic-strip"),
  ];
}

async function prepare(page: Page, path: string, theme: string) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("hrh-theme", t as string);
    } catch {
      /* ignore */
    }
  }, theme);
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t as string), theme);
  await page.evaluate(() => document.fonts.ready);
  // settle any client mount (consent chip, etc.)
  await page.waitForTimeout(300);
}

for (const fixture of FIXTURES) {
  for (const theme of THEMES) {
    for (const vp of WIDTHS) {
      test(`${fixture.name} · ${theme} · ${vp.name}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await prepare(page, fixture.path, theme);
        await expect(page).toHaveScreenshot(`${fixture.name}-${theme}-${vp.name}.png`, {
          fullPage: true,
          animations: "disabled",
          mask: timeMasks(page),
          maxDiffPixelRatio: 0.005,
          threshold: 0.2,
        });
      });
    }
  }
}

// Module-level shots at laptop width — the actionable failures. Locators are
// the prototype's own class names.
const MODULES: Record<string, string> = {
  masthead: ".news-header",
  "hero": ".cinematic-hero",
  "newsletter-band": ".morning-line",
  "leader-ad": ".ad-leader",
  "editorial-grid": ".editorial-grid",
  "catch-up": ".briefing-card",
  "cities-band": ".cities-band",
  footer: ".news-footer",
};

test.describe("home modules · laptop · light", () => {
  for (const [name, selector] of Object.entries(MODULES)) {
    test(`module ${name}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await prepare(page, "/design/fixtures/home", "light");
      const el = page.locator(selector).first();
      if ((await el.count()) === 0) test.skip(true, `no ${selector} on home`);
      await expect(el).toHaveScreenshot(`module-${name}.png`, {
        animations: "disabled",
        mask: timeMasks(page),
        maxDiffPixelRatio: 0.001,
        threshold: 0.2,
      });
    });
  }
});

const ARTICLE_MODULES: Record<string, string> = {
  "article-header": ".article-header",
  briefing: ".smart-brief",
  "pull-quote": ".quote-card",
  "inline-ad": ".article-inline-ad",
  "funding-chart": ".data-viz",
  "source-notes": ".source-notes",
  "article-rail": ".article-rail",
};

test.describe("article modules · laptop · light", () => {
  for (const [name, selector] of Object.entries(ARTICLE_MODULES)) {
    test(`module ${name}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await prepare(page, "/design/fixtures/article", "light");
      const el = page.locator(selector).first();
      if ((await el.count()) === 0) test.skip(true, `no ${selector} on article`);
      await expect(el).toHaveScreenshot(`module-article-${name}.png`, {
        animations: "disabled",
        mask: timeMasks(page),
        maxDiffPixelRatio: 0.001,
        threshold: 0.2,
      });
    });
  }
});
