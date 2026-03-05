// @ts-check
const { test, expect } = require("@playwright/test");
const { clearAll, seedSession, waitForToast } = require("./helpers");

test.describe("Flow 9: データ管理（エクスポート・インポート）", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await clearAll(page);
  });

  test("データタブに記録件数が表示される", async ({ page }) => {
    await seedSession(page, { id: 4001 });
    await seedSession(page, { id: 4002 });
    await page.reload();

    await page.click('[data-tab="data"]');
    await page.waitForSelector("#pane-data.active");

    await expect(page.locator("#data-count")).toHaveText("2");
  });

  test("データなし時の記録件数は0", async ({ page }) => {
    await page.reload();
    await page.click('[data-tab="data"]');
    await page.waitForSelector("#pane-data.active");

    await expect(page.locator("#data-count")).toHaveText("0");
  });

  test("データなし時にJSONエクスポートするとトーストが出る", async ({ page }) => {
    await page.reload();
    await page.click('[data-tab="data"]');
    await page.waitForSelector("#pane-data.active");

    await page.click("button[onclick='exportJSON()']");
    await waitForToast(page, "データがありません");
  });

  test("データありでJSONエクスポートが発火する", async ({ page }) => {
    await seedSession(page, { id: 4010, shop: "エクスポート雀荘" });
    await page.reload();

    await page.click('[data-tab="data"]');
    await page.waitForSelector("#pane-data.active");

    // ダウンロードイベントをキャプチャ（blob URLのため名称はブラウザ依存）
    const downloadPromise = page.waitForEvent("download", { timeout: 5000 });
    await page.click("button[onclick='exportJSON()']");
    await downloadPromise; // ダウンロードイベントが発火したことを確認
    // トーストでエクスポート成功メッセージを確認
    await waitForToast(page, "JSONエクスポート完了");
  });

  test("データありでCSVエクスポートが発火する", async ({ page }) => {
    await seedSession(page, { id: 4011, shop: "CSVテスト雀荘" });
    await page.reload();

    await page.click('[data-tab="data"]');
    await page.waitForSelector("#pane-data.active");

    const downloadPromise = page.waitForEvent("download", { timeout: 5000 });
    await page.click("button[onclick='exportCSV()']");
    await downloadPromise; // ダウンロードイベントが発火したことを確認
    await waitForToast(page, "CSVエクスポート完了");
  });

  test("JSONインポートで新しいセッションが追加される", async ({ page }) => {
    await page.reload();

    const importData = {
      sessions: [
        {
          id: 9001,
          shop: "インポート雀荘",
          date: "2024-05-01",
          players: 4,
          format: "東南戦",
          gameType: "free",
          counts: { 1: 1, 2: 1, 3: 1, 4: 1 },
          balance: 500,
          net: 500,
        },
      ],
      shops: [],
    };

    await page.click('[data-tab="data"]');
    await page.waitForSelector("#pane-data.active");

    // ファイルインポートをシミュレート
    const fileInput = page.locator("#file-input");
    await fileInput.setInputFiles({
      name: "backup.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(importData)),
    });

    await waitForToast(page, "インポートしました");

    const sessions = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("mj4_sessions") || "[]")
    );
    expect(sessions.length).toBe(1);
    expect(sessions[0].shop).toBe("インポート雀荘");
  });

  test("重複IDのインポートはスキップされる", async ({ page }) => {
    await seedSession(page, { id: 9010, shop: "既存雀荘" });
    await page.reload();

    const importData = {
      sessions: [{ id: 9010, shop: "重複雀荘", date: "2024-01-01", balance: 0, net: 0 }],
      shops: [],
    };

    await page.click('[data-tab="data"]');
    await page.waitForSelector("#pane-data.active");

    const fileInput = page.locator("#file-input");
    await fileInput.setInputFiles({
      name: "backup.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(importData)),
    });

    await waitForToast(page, "追加する新しいデータがありませんでした");

    const sessions = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("mj4_sessions") || "[]")
    );
    expect(sessions.length).toBe(1);
    expect(sessions[0].shop).toBe("既存雀荘"); // 上書きされていない
  });

  test("全データ削除でセッションが0件になる", async ({ page }) => {
    await seedSession(page, { id: 4020 });
    await page.reload();

    await page.click('[data-tab="data"]');
    await page.waitForSelector("#pane-data.active");

    page.once("dialog", (dialog) => dialog.accept());
    await page.click("button[onclick='clearAll()']");

    await waitForToast(page, "削除しました");

    const sessions = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("mj4_sessions") || "[]")
    );
    expect(sessions.length).toBe(0);
    await expect(page.locator("#data-count")).toHaveText("0");
  });

  test("データなし時に全削除するとトーストが出る", async ({ page }) => {
    await page.reload();
    await page.click('[data-tab="data"]');
    await page.waitForSelector("#pane-data.active");

    await page.click("button[onclick='clearAll()']");
    await waitForToast(page, "データがありません");
  });
});
