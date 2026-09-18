import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://localhost:8000",
    headless: true,
  },
  webServer: {
    command: "node scripts/e2e-server.mjs",
    url: "http://localhost:8000/health",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});