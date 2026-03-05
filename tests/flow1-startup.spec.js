// @ts-check
const { test, expect } = require("@playwright/test");
const { clearAll } = require("./helpers");

test.describe("Flow 1: アプリ起動・初期表示", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await clearAll(page);
    await page.reload();
  });

  test("記録タブがデフォルトでアクティブ", async ({ page }) => {
    await expect(page.locator('[data-tab="record"]')).toHaveClass(/active/);
    await expect(page.locator("#pane-record")).toHaveClass(/active/);
  });

  test("セットアップフォームが表示される", async ({ page }) => {
    await expect(page.locator("#setup-section")).toBeVisible();
    await expect(page.locator("#session-section")).toBeHidden();
  });

  test("今日の日付が自動セットされる", async ({ page }) => {
    const today = new Date().toISOString().slice(0, 10);
    const dateVal = await page.locator("#s-date").inputValue();
    expect(dateVal).toBe(today);
  });

  test("5つのタブが存在する", async ({ page }) => {
    const tabs = ["record", "history", "analysis", "shops", "data"];
    for (const tab of tabs) {
      await expect(page.locator(`[data-tab="${tab}"]`)).toBeVisible();
    }
  });

  test("アプリタイトルが正しい", async ({ page }) => {
    await expect(page).toHaveTitle("麻雀成績集計");
  });
});
