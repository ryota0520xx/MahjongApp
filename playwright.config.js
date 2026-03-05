// @ts-check
const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 30000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL: "http://localhost:3939",
    headless: true,
    viewport: { width: 390, height: 844 }, // iPhone 14 相当（Android想定）
    locale: "ja-JP",
  },
  webServer: {
    command: "npx serve . -l 3939 --no-clipboard",
    url: "http://localhost:3939",
    reuseExistingServer: false,
    timeout: 15000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
