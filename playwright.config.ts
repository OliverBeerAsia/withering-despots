import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:4173";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: "line",
  snapshotPathTemplate: "{testDir}/visual/snapshots/{projectName}/{arg}{ext}",
  use: {
    baseURL,
    colorScheme: "dark",
    contextOptions: {
      reducedMotion: "reduce",
    },
    deviceScaleFactor: 1,
    locale: "en-GB",
    serviceWorkers: "block",
    timezoneId: "Europe/Moscow",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium-1920x1080",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: "chromium-1366x768",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1366, height: 768 },
      },
    },
  ],
  webServer: {
    command: "corepack pnpm dev --host 127.0.0.1 --port 4173",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
