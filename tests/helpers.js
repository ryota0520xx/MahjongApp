/**
 * テストヘルパー関数
 * localStorage へのデータ注入などを提供
 */

/** テスト用セッションデータをlocalStorageに追加 */
async function seedSession(page, overrides = {}) {
  const session = {
    id: Date.now(),
    shop: "テスト雀荘",
    date: "2024-01-15",
    players: 4,
    format: "東南戦",
    rule: "5",
    gameType: "free",
    shopId: null,
    counts: { 1: 3, 2: 2, 3: 1, 4: 0 },
    balance: 500,
    chips: 0,
    chipUnit: 0,
    chipVal: 0,
    venueFee: 0,
    net: 500,
    gameFee: 0,
    topPrize: 0,
    note: "テストメモ",
    ...overrides,
  };
  await page.evaluate((s) => {
    const existing = JSON.parse(localStorage.getItem("mj4_sessions") || "[]");
    existing.unshift(s);
    localStorage.setItem("mj4_sessions", JSON.stringify(existing));
  }, session);
  return session;
}

/** テスト用店舗データをlocalStorageに追加 */
async function seedShop(page, overrides = {}) {
  const shop = {
    id: Date.now(),
    name: "テスト雀荘",
    players: 4,
    format: "東南戦",
    rule: "5",
    chipUnit: 500,
    chipNote: "赤チップ",
    gameFee: 200,
    topPrize: 300,
    ...overrides,
  };
  await page.evaluate((s) => {
    const existing = JSON.parse(localStorage.getItem("mj4_shops") || "[]");
    existing.push(s);
    localStorage.setItem("mj4_shops", JSON.stringify(existing));
  }, shop);
  return shop;
}

/** 全データをクリア */
async function clearAll(page) {
  await page.evaluate(() => {
    localStorage.removeItem("mj4_sessions");
    localStorage.removeItem("mj4_shops");
    sessionStorage.removeItem("mj4_cur");
  });
}

/** トーストメッセージが表示されるのを待つ */
async function waitForToast(page, expectedText) {
  const toast = page.locator("#toast");
  if (expectedText) {
    const { expect } = require("@playwright/test");
    await expect(toast).toContainText(expectedText, { timeout: 5000 });
  } else {
    await toast.waitFor({ state: "visible" });
  }
}

/** タブを切り替える */
async function switchTab(page, tabName) {
  await page.click(`[data-tab="${tabName}"]`);
  await page.waitForSelector(`#pane-${tabName}.active`);
}

module.exports = { seedSession, seedShop, clearAll, waitForToast, switchTab };
