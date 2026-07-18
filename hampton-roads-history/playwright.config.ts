import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// This sandbox pre-installs Chromium at a fixed path instead of Playwright's
// usual cache dir; CI environments install browsers normally, so only pin
// executablePath when that fixed path is actually present.
const sandboxChromium = "/opt/pw-browsers/chromium";
const launchOptions = existsSync(sandboxChromium)
  ? { executablePath: sandboxChromium }
  : {};

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      testDir: "./tests/e2e",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions,
      },
    },
    {
      // Pixel-perfect visual regression for the VaporNet surfaces.
      // Run: ALLOW_DESIGN_FIXTURES=1 npm run test:visual
      // (Chromium only, deterministic font rendering — plan §6.)
      name: "visual",
      testDir: "./tests/visual",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions,
        deviceScaleFactor: 1,
      },
    },
  ],
  // The visual project needs the design fixtures reachable; when its build
  // command sets ALLOW_DESIGN_FIXTURES the fixtures render, otherwise they
  // 404 (production-safe). NEXT_PUBLIC_SUPABASE_* must be present at build
  // time for the client bundle; the layout falls back to the canonical
  // cities if the DB is unreachable.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run build && npm run start",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 240_000,
      },
});
