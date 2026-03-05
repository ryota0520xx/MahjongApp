// @ts-check
const { test, expect } = require("@playwright/test");
const { clearAll, seedSession } = require("./helpers");

test.describe("Flow 6: 履歴閲覧・フィルタリング", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await clearAll(page);

    // テストデータを注入
    await seedSession(page, {
      id: 1001,
      shop: "雀荘A",
      date: "2024-01-10",
      players: 4,
      gameType: "free",
      rule: "5",
      counts: { 1: 2, 2: 1, 3: 1, 4: 0 },
      balance: 1000,
      net: 1000,
    });
    await seedSession(page, {
      id: 1002,
      shop: "雀荘B",
      date: "2024-02-15",
      players: 3,
      gameType: "set",
      rule: "10",
      counts: { 1: 1, 2: 2, 3: 0, 4: 0 },
      balance: -500,
      net: -500,
    });
    await seedSession(page, {
      id: 1003,
      shop: "雀荘A",
      date: "2024-03-20",
      players: 4,
      gameType: "free",
      rule: "5",
      counts: { 1: 0, 2: 1, 3: 2, 4: 1 },
      balance: -1500,
      net: -1500,
    });

    await page.reload();
    await page.click('[data-tab="history"]');
    await page.waitForSelector("#pane-history.active");
  });

  test("履歴タブにセッション一覧が表示される", async ({ page }) => {
    await expect(page.locator("#history-list")).toBeVisible();
    const items = page.locator("#history-list .sess-card, #history-list .hist-row, #history-list > div");
    await expect(items.first()).toBeVisible();
  });

  test("人数フィルターで絞り込みできる", async ({ page }) => {
    await page.selectOption("#f-players", "3");
    // 3人セッション（雀荘B）のみ表示される
    await expect(page.locator("#history-list")).toContainText("雀荘B");
    await expect(page.locator("#history-list")).not.toContainText("雀荘A");
  });

  test("ゲーム種別フィルターで絞り込みできる", async ({ page }) => {
    await page.selectOption("#f-gametype", "set");
    await expect(page.locator("#history-list")).toContainText("雀荘B");
    await expect(page.locator("#history-list")).not.toContainText("雀荘A");
  });

  test("店舗フィルターで絞り込みできる", async ({ page }) => {
    await page.selectOption("#f-shop", "雀荘A");
    await expect(page.locator("#history-list")).toContainText("雀荘A");
    await expect(page.locator("#history-list")).not.toContainText("雀荘B");
  });

  test("日付範囲フィルターで絞り込みできる", async ({ page }) => {
    await page.fill("#f-date-start", "2024-02-01");
    await page.fill("#f-date-end", "2024-02-28");
    await page.selectOption("#f-sort", "new"); // トリガー

    await expect(page.locator("#history-list")).toContainText("雀荘B");
    await expect(page.locator("#history-list")).not.toContainText("雀荘A");
  });

  test("フィルターをリセット（全表示）で全セッション表示", async ({ page }) => {
    // 一度絞り込む
    await page.selectOption("#f-players", "3");
    // 全人数に戻す
    await page.selectOption("#f-players", "all");
    await expect(page.locator("#history-list")).toContainText("雀荘A");
    await expect(page.locator("#history-list")).toContainText("雀荘B");
  });
});
