// @ts-check
const { test, expect } = require("@playwright/test");
const { clearAll, waitForToast } = require("./helpers");

test.describe("Flow 3: セットセッション（チップあり）", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await clearAll(page);
    await page.reload();
  });

  test("セット選択でプリセット欄が非表示になる", async ({ page }) => {
    await page.selectOption("#s-gametype", "set");
    await expect(page.locator("#shop-preset-fg")).toBeHidden();
  });

  test("セットセッション開始でチップ入力欄が表示される", async ({ page }) => {
    await page.selectOption("#s-gametype", "set");
    await page.click("button[onclick='startSession()']");

    await expect(page.locator("#chip-input-wrap")).toBeVisible();
    await expect(page.locator("#chip-unit-manual-wrap")).toBeVisible();
  });

  test("セットセッションでラベルが素点収支に変わる", async ({ page }) => {
    await page.selectOption("#s-gametype", "set");
    await page.click("button[onclick='startSession()']");

    await expect(page.locator("#balance-label")).toHaveText(/素点収支/);
  });

  test("チップ枚数×単価で純収支が計算される", async ({ page }) => {
    await page.selectOption("#s-gametype", "set");
    await page.click("button[onclick='startSession()']");

    await page.fill("#s-balance", "500");
    await page.fill("#s-chips", "3");
    await page.fill("#s-chip-unit-manual", "500");
    // チップ計算のトリガー
    await page.locator("#s-chips").dispatchEvent("input");

    // 純収支 = 500 + 3*500 = 2000
    await expect(page.locator("#save-summary")).toContainText("2,000");
  });

  test("場代入力欄がセットで表示される", async ({ page }) => {
    await page.selectOption("#s-gametype", "set");
    await page.click("button[onclick='startSession()']");

    await expect(page.locator("#venue-fee-wrap")).toBeVisible();
  });

  test("セットセッション保存でlocalStorageにgameType=setが記録される", async ({ page }) => {
    await page.selectOption("#s-gametype", "set");
    await page.click("button[onclick='startSession()']");
    await page.fill("#s-balance", "300");
    await page.fill("#s-chips", "2");
    await page.fill("#s-chip-unit-manual", "500");
    await page.click("button[onclick='saveSession()']");

    await waitForToast(page, "保存しました");
    await page.waitForTimeout(1000);

    const sessions = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("mj4_sessions") || "[]")
    );
    expect(sessions[0].gameType).toBe("set");
    expect(sessions[0].chips).toBe(2);
    expect(sessions[0].chipVal).toBe(1000);
  });
});
