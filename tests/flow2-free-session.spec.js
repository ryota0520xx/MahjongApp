// @ts-check
const { test, expect } = require("@playwright/test");
const { clearAll, waitForToast } = require("./helpers");

test.describe("Flow 2: フリーセッション開始〜カウント〜保存", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await clearAll(page);
    await page.reload();
  });

  test("セッション開始でカウンター画面に遷移する", async ({ page }) => {
    // フリーを選択（デフォルト）し店舗名を入力
    await page.selectOption("#s-gametype", "free");
    await page.fill("#s-shop", "テスト雀荘");
    await page.selectOption("#s-players", "4");
    await page.click("button[onclick='startSession()']");

    await expect(page.locator("#session-section")).toBeVisible();
    await expect(page.locator("#setup-section")).toBeHidden();
    await expect(page.locator("#sess-shop")).toHaveText("テスト雀荘");
  });

  test("4人分のカウンターカードが表示される", async ({ page }) => {
    await page.fill("#s-shop", "テスト雀荘");
    await page.click("button[onclick='startSession()']");

    // 1着〜4着のカードが存在する
    for (let p = 1; p <= 4; p++) {
      await expect(page.locator(`#n${p}`)).toBeVisible();
    }
  });

  test("3人麻雀では3枚のカウンターが表示される", async ({ page }) => {
    await page.selectOption("#s-players", "3");
    await page.click("button[onclick='startSession()']");

    await expect(page.locator("#n1")).toBeVisible();
    await expect(page.locator("#n2")).toBeVisible();
    await expect(page.locator("#n3")).toBeVisible();
    await expect(page.locator("#n4")).toBeHidden();
  });

  test("+ボタンでカウントが増える", async ({ page }) => {
    await page.click("button[onclick='startSession()']");

    // 1着の+ボタンを押す
    await page.click(".counter-card:nth-child(1) .cnt-btn.plus");
    await expect(page.locator("#n1")).toHaveText("1");
    await expect(page.locator("#cur-total")).toHaveText("1");
  });

  test("−ボタンでカウントが減る", async ({ page }) => {
    await page.click("button[onclick='startSession()']");

    const plusBtn = page.locator(".counter-card:nth-child(1) .cnt-btn.plus");
    await plusBtn.click();
    await plusBtn.click();
    await page.click(".counter-card:nth-child(1) .cnt-btn.minus");

    await expect(page.locator("#n1")).toHaveText("1");
  });

  test("カウントは0以下にならない", async ({ page }) => {
    await page.click("button[onclick='startSession()']");

    // 0の状態でマイナスを押しても0のまま
    await page.click(".counter-card:nth-child(1) .cnt-btn.minus");
    await expect(page.locator("#n1")).toHaveText("0");
  });

  test("複数着のカウントの合計が正しく表示される", async ({ page }) => {
    await page.click("button[onclick='startSession()']");

    // 1着2回、2着1回
    const cards = page.locator(".counter-card");
    await cards.nth(0).locator(".cnt-btn.plus").click();
    await cards.nth(0).locator(".cnt-btn.plus").click();
    await cards.nth(1).locator(".cnt-btn.plus").click();

    await expect(page.locator("#cur-total")).toHaveText("3");
    await expect(page.locator("#n1")).toHaveText("2");
    await expect(page.locator("#n2")).toHaveText("1");
  });

  test("フリーセッションではチップ入力欄が非表示", async ({ page }) => {
    await page.selectOption("#s-gametype", "free");
    await page.click("button[onclick='startSession()']");

    // フリーかつショップデータなしの場合、チップ欄は非表示
    await expect(page.locator("#chip-input-wrap")).toBeHidden();
  });

  test("セッション保存後にセットアップ画面に戻る", async ({ page }) => {
    await page.fill("#s-shop", "テスト雀荘");
    await page.click("button[onclick='startSession()']");

    // 収支を入力して保存
    await page.fill("#s-balance", "1000");
    await page.click("button[onclick='saveSession()']");

    // トーストが出て、セットアップに戻る
    await waitForToast(page, "保存しました");
    await expect(page.locator("#setup-section")).toBeVisible({ timeout: 3000 });
  });

  test("保存したセッションがlocalStorageに記録される", async ({ page }) => {
    await page.fill("#s-shop", "雀荘A");
    await page.click("button[onclick='startSession()']");
    await page.fill("#s-balance", "2000");
    await page.click("button[onclick='saveSession()']");

    await waitForToast(page, "保存しました");
    await page.waitForTimeout(1000); // clearSession の setTimeout 待ち

    const sessions = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("mj4_sessions") || "[]")
    );
    expect(sessions.length).toBe(1);
    expect(sessions[0].shop).toBe("雀荘A");
    expect(sessions[0].balance).toBe(2000);
    expect(sessions[0].gameType).toBe("free");
  });

  test("セッション中のページリロードで進行状態が復元される", async ({ page }) => {
    await page.fill("#s-shop", "テスト雀荘");
    await page.click("button[onclick='startSession()']");
    await page.locator(".counter-card:nth-child(1) .cnt-btn.plus").click();

    // リロード
    await page.reload();

    // セッションが復元される
    await expect(page.locator("#session-section")).toBeVisible();
    await expect(page.locator("#n1")).toHaveText("1");
  });
});
