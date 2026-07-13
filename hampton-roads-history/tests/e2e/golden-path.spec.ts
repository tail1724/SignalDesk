import { test, expect } from "@playwright/test";

// Golden path per WS-16: home -> article -> save -> newsletter subscribe.
// Requires a reachable Supabase project with published articles, so this
// runs against a real deployment (CI / staging) rather than this sandbox,
// whose egress policy blocks the Supabase host.

test.describe("golden path", () => {
  test("home to article navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/.+/);

    const firstArticleLink = page.locator("main a[href*='-']").first();
    await expect(firstArticleLink).toBeVisible();
    const href = await firstArticleLink.getAttribute("href");

    await firstArticleLink.click();
    await expect(page).toHaveURL(new RegExp(href!.replace(/[/]/g, "\\/")));
    await expect(page.locator("h1")).toBeVisible();
  });

  test("saving an article while logged out redirects to /account", async ({ page }) => {
    await page.goto("/");
    const firstArticleLink = page.locator("main a[href*='-']").first();
    await firstArticleLink.click();
    await page.waitForURL(/\/[a-z-]+\/[a-z0-9-]+$/);

    const saveButton = page.getByRole("button", { name: /save/i });
    await expect(saveButton).toBeVisible();
    await saveButton.click();

    await expect(page).toHaveURL(/\/account$/);
  });

  test("newsletter subscribe from the homepage rail", async ({ page }) => {
    await page.goto("/");

    const emailInput = page.getByLabel("Email address").first();
    await emailInput.fill(`e2e-${Date.now()}@example.com`);

    const subscribeButton = page.getByRole("button", { name: /subscribe free/i }).first();
    await subscribeButton.click();

    await expect(page.getByText(/check your inbox/i)).toBeVisible({ timeout: 10_000 });
  });
});
