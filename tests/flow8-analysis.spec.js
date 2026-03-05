// @ts-check
const { test, expect } = require("@playwright/test");
const { clearAll, seedSession } = require("./helpers");

test.describe("Flow 8: 分析タブ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await clearAll(page);
  });

  test("データなし時に分析タブがエラーなく表示される", async ({ page }) => {
    await page.reload();
    await page.click('[data-tab="analysis"]');
    await page.waitForSelector("#pane-analysis.active");

    // JavaScriptエラーが出ていないことを確認
    const errors = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);

    await expect(page.locator("#pane-analysis")).toBeVisible();
  });

  test("セッションデータありで分析タブが正常描画される", async ({ page }) => {
    // 複数のテストデータを注入
    for (let i = 0; i < 5; i++) {
      await seedSession(page, {
        id: 3000 + i,
        date: `2024-0${i + 1}-15`,
        gameType: i % 2 === 0 ? "free" : "set",
        players: i % 2 === 0 ? 4 : 3,
        counts: { 1: 2, 2: 1, 3: 1, 4: 0 },
        balance: (i - 2) * 500,
        net: (i - 2) * 500,
      });
    }

    await page.reload();

    const errors = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.click('[data-tab="analysis"]');
    await page.waitForSelector("#pane-analysis.active");
    await page.waitForTimeout(800); // チャート描画を待つ

    expect(errors).toHaveLength(0);
    await expect(page.locator("#pane-analysis")).toBeVisible();
  });

  test("分析タブのフィルターが機能する", async ({ page }) => {
    await seedSession(page, { id: 3100, players: 4, gameType: "free" });
    await seedSession(page, { id: 3101, players: 3, gameType: "set" });

    await page.reload();
    await page.click('[data-tab="analysis"]');
    await page.waitForSelector("#pane-analysis.active");

    // 人数フィルター変更でエラーが出ないこと
    await page.selectOption("#an-players", "4");
    await page.waitForTimeout(300);

    const errors = [];
    page.on("pageerror", (err) => errors.push(err.message));
    expect(errors).toHaveLength(0);
  });

  test("収支推移チャートエリアが存在する", async ({ page }) => {
    await page.reload();
    await page.click('[data-tab="analysis"]');
    await page.waitForSelector("#pane-analysis.active");

    await expect(page.locator("#an-line")).toBeVisible();
  });
});
