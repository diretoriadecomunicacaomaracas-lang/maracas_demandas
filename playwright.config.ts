import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  use: { baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000", trace: "on-first-retry" },
  webServer: process.env.CI ? undefined : { command: "npm run dev", url: "http://localhost:3000", reuseExistingServer: true },
});
