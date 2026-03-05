// @ts-check
const { test, expect } = require("@playwright/test");
const { clearAll, waitForToast } = require("./helpers");

test.describe("Flow 5: 店舗プリセット登録〜適用", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await clearAll(page);
    await page.reload();
  });

  async function addShopViaUI(page, shopName) {
    await page.click('[data-tab="shops"]');
    await page.waitForSelector("#pane-shops.active");
    await page.click("button[onclick='showShopForm()']");
    await page.fill("#sf-name", shopName);
    await page.fill("#sf-chip-unit", "500");
    await page.fill("#sf-game-fee", "200");
    await page.fill("#sf-top-prize", "300");
    await page.click("button[onclick='saveShop()']");
    await waitForToast(page, "店舗を追加しました");
  }

  test("店舗追加フォームが表示される", async ({ page }) => {
    await page.click('[data-tab="shops"]');
    await page.waitForSelector("#pane-shops.active");
    await page.click("button[onclick='showShopForm()']");

    await expect(page.locator("#shop-form-panel")).toBeVisible();
  });

  test("店舗追加後に一覧に表示される", async ({ page }) => {
    await addShopViaUI(page, "雀荘テスト");
    await expect(page.locator("#shop-list")).toContainText("雀荘テスト");
  });

  test("店舗名未入力で保存するとトーストが出る", async ({ page }) => {
    await page.click('[data-tab="shops"]');
    await page.waitForSelector("#pane-shops.active");
    await page.click("button[onclick='showShopForm()']");
    // 店舗名は空のまま保存
    await page.click("button[onclick='saveShop()']");

    const toast = page.locator("#toast");
    await toast.waitFor({ state: "visible" });
    // トーストに何らかのメッセージが表示される（文字化けしていないこと）
    const toastText = await toast.textContent();
    expect(toastText).toBeTruthy();
    expect(toastText.length).toBeGreaterThan(0);
  });

  test("追加した店舗が記録タブのプリセットに表示される", async ({ page }) => {
    await addShopViaUI(page, "プリセット雀荘");

    // 記録タブに戻る
    await page.click('[data-tab="record"]');
    await page.waitForSelector("#pane-record.active");

    // フリーを選択（プリセット欄が出る）
    await page.selectOption("#s-gametype", "free");

    const preset = page.locator("#s-shop-preset");
    await expect(preset).toContainText("プリセット雀荘");
  });

  test("プリセット選択でフォームが自動入力される", async ({ page }) => {
    await addShopViaUI(page, "自動入力雀荘");

    await page.click('[data-tab="record"]');
    await page.waitForSelector("#pane-record.active");

    await page.selectOption("#s-gametype", "free");

    // プリセットを選択
    const preset = page.locator("#s-shop-preset");
    await preset.selectOption({ label: "自動入力雀荘" });

    // 店舗名フィールドが自動入力される
    await expect(page.locator("#s-shop")).toHaveValue("自動入力雀荘");
  });

  test("店舗編集が反映される", async ({ page }) => {
    await addShopViaUI(page, "編集前雀荘");

    // 編集ボタンをクリック（onclick="editShop(id)" の形式）
    const editBtn = page.locator("#shop-list button[onclick*='editShop']").first();
    await editBtn.click();

    await page.fill("#sf-name", "編集後雀荘");
    await page.click("button[onclick='saveShop()']");
    await waitForToast(page, "店舗を更新しました");

    await expect(page.locator("#shop-list")).toContainText("編集後雀荘");
    await expect(page.locator("#shop-list")).not.toContainText("編集前雀荘");
  });

  test("店舗削除が反映される", async ({ page }) => {
    await addShopViaUI(page, "削除対象雀荘");
    await expect(page.locator("#shop-list")).toContainText("削除対象雀荘");

    page.once("dialog", (dialog) => dialog.accept());
    const deleteBtn = page.locator("#shop-list button[onclick*='deleteShop']").first();
    await deleteBtn.click();

    await waitForToast(page, "削除しました");
    await expect(page.locator("#shop-list")).not.toContainText("削除対象雀荘");
  });
});
