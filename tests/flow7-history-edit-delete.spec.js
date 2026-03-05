// @ts-check
const { test, expect } = require("@playwright/test");
const { clearAll, seedSession, waitForToast } = require("./helpers");

test.describe("Flow 7: 履歴編集・削除", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await clearAll(page);

    await seedSession(page, {
      id: 2001,
      shop: "編集テスト雀荘",
      date: "2024-01-15",
      players: 4,
      gameType: "free",
      counts: { 1: 2, 2: 1, 3: 1, 4: 0 },
      balance: 1000,
      net: 1000,
      note: "元のメモ",
    });

    await page.reload();
    await page.click('[data-tab="history"]');
    await page.waitForSelector("#pane-history.active");
  });

  test("編集ボタンクリックで編集パネルが表示される", async ({ page }) => {
    const editBtn = page.locator("button[onclick*='editSess']").first();
    await editBtn.click();

    await expect(page.locator("#session-edit-panel")).toBeVisible();
  });

  test("編集後に保存すると変更が反映される", async ({ page }) => {
    const editBtn = page.locator("button[onclick*='editSess']").first();
    await editBtn.click();

    // 収支を変更
    await page.fill("#edit-balance", "2000");
    await page.click("button[onclick='updateSession()']");

    await waitForToast(page, "更新しました");

    // localStorageを確認
    const sessions = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("mj4_sessions") || "[]")
    );
    expect(sessions[0].balance).toBe(2000);
  });

  test("編集キャンセルで元データが保たれる", async ({ page }) => {
    const editBtn = page.locator("button[onclick*='editSess']").first();
    await editBtn.click();

    await page.fill("#edit-balance", "9999");
    await page.click("button[onclick='cancelEdit()']");

    await expect(page.locator("#session-edit-panel")).toBeHidden();

    const sessions = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("mj4_sessions") || "[]")
    );
    expect(sessions[0].balance).toBe(1000); // 元の値
  });

  test("削除ボタンクリックでconfirmダイアログが表示される", async ({ page }) => {
    let dialogShown = false;
    page.once("dialog", async (dialog) => {
      dialogShown = true;
      await dialog.dismiss();
    });

    const deleteBtn = page.locator("button[onclick*='delSess']").first();
    await deleteBtn.click();
    expect(dialogShown).toBe(true);
  });

  test("削除確認OKでセッションが削除される", async ({ page }) => {
    // confirm ダイアログを常に承認するようにモック
    await page.evaluate(() => { window.confirm = () => true; });

    const deleteBtn = page.locator("button[onclick*='delSess']").first();
    await deleteBtn.click();

    // localStorageでセッションが削除されたことを確認（トーストのタイミング問題を回避）
    await page.waitForFunction(
      () => JSON.parse(localStorage.getItem("mj4_sessions") || "[]").length === 0,
      { timeout: 5000 }
    );

    const sessions = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("mj4_sessions") || "[]")
    );
    expect(sessions.length).toBe(0);

    // 履歴リストが空になっていることも確認
    await expect(page.locator("#history-list")).not.toContainText("編集テスト雀荘");
  });

  test("削除キャンセルでセッションが残る", async ({ page }) => {
    page.once("dialog", (dialog) => dialog.dismiss());

    const deleteBtn = page.locator("button[onclick*='delSess']").first();
    await deleteBtn.click();

    await page.waitForTimeout(500);
    const sessions = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("mj4_sessions") || "[]")
    );
    expect(sessions.length).toBe(1);
  });
});
