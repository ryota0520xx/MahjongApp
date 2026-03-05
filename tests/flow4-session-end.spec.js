// @ts-check
const { test, expect } = require("@playwright/test");
const { clearAll } = require("./helpers");

test.describe("Flow 4: セッション中断（終了確認）", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await clearAll(page);
    await page.reload();
    // セッション開始
    await page.fill("#s-shop", "テスト雀荘");
    await page.click("button[onclick='startSession()']");
    await expect(page.locator("#session-section")).toBeVisible();
  });

  test("終了ボタンクリックでconfirmダイアログが表示される", async ({ page }) => {
    // confirm をキャプチャ
    let dialogShown = false;
    page.once("dialog", async (dialog) => {
      dialogShown = true;
      await dialog.dismiss(); // キャンセル
    });
    await page.click("button[onclick='confirmEnd()']");
    expect(dialogShown).toBe(true);
  });

  test("終了確認キャンセルでセッション継続", async ({ page }) => {
    page.once("dialog", (dialog) => dialog.dismiss());
    await page.click("button[onclick='confirmEnd()']");

    // セッション画面のまま
    await expect(page.locator("#session-section")).toBeVisible();
  });

  test("終了確認OKでセットアップ画面に戻る", async ({ page }) => {
    page.once("dialog", (dialog) => dialog.accept());
    await page.click("button[onclick='confirmEnd()']");

    await expect(page.locator("#setup-section")).toBeVisible({ timeout: 3000 });
    await expect(page.locator("#session-section")).toBeHidden();
  });

  test("終了後にsessionStorageからデータが削除される", async ({ page }) => {
    page.once("dialog", (dialog) => dialog.accept());
    await page.click("button[onclick='confirmEnd()']");

    await expect(page.locator("#setup-section")).toBeVisible({ timeout: 3000 });
    const cur = await page.evaluate(() => sessionStorage.getItem("mj4_cur"));
    expect(cur).toBeNull();
  });
});
