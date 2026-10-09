import { randomBytes } from "node:crypto";
import { defineConfig, devices } from "@playwright/test";
process.loadEnvFile(".env.local");
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60000,
  expect: { timeout: 15000 },
  use: {
    baseURL: "http://localhost:3100",
    actionTimeout: 10000,
    extraHTTPHeaders: {
      "x-forwarded-for":
        "fd42:" +
        randomBytes(6).toString("hex").match(/.{4}/g)!.join(":") +
        "::1",
    },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: true,
    timeout: 120000,
  },
  reporter: [["list"], ["html", { open: "never" }]],
});
