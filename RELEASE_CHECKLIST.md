# Android ストアリリース前チェックリスト

## テスト結果サマリー

**実行日**: 2026-03-05
**テストフレームワーク**: Playwright v1.56.0 (Chromium)
**総テスト数**: 58
**結果**: ✅ 58/58 合格（100%）

---

## ✅ 確認済みユーザー導線（全合格）

| フロー | テスト数 | 結果 |
|--------|---------|------|
| Flow 1: アプリ起動・初期表示 | 5 | ✅ 全合格 |
| Flow 2: フリーセッション開始〜カウント〜保存 | 11 | ✅ 全合格 |
| Flow 3: セットセッション（チップあり） | 6 | ✅ 全合格 |
| Flow 4: セッション中断（終了確認） | 4 | ✅ 全合格 |
| Flow 5: 店舗プリセット登録〜適用 | 7 | ✅ 全合格 |
| Flow 6: 履歴閲覧・フィルタリング | 6 | ✅ 全合格 |
| Flow 7: 履歴編集・削除 | 6 | ✅ 全合格 |
| Flow 8: 分析タブ | 4 | ✅ 全合格 |
| Flow 9: データ管理（エクスポート・インポート） | 9 | ✅ 全合格 |

---

## 🐛 テスト中に発見・修正済みバグ

### BUG-001: 店舗名バリデーションメッセージの文字化け ✅ 修正済み
- **場所**: `index.html` line 2441, `www/index.html` line 2460
- **内容**: `"店舗名���入力してください"` → `"店舗名を入力してください"` に修正
- **影響**: 店舗名未入力で保存しようとした際のトーストメッセージが文字化けしていた

---

## ⚠️ リリース前に対処が必要な項目

### HIGH: App ID が未設定（ストア登録不可）
- **ファイル**: `capacitor.config.json`
- **現状**: `"appId": "com.example.app"`
- **対応**: Playストア固有のアプリID（例: `com.yourcompany.mahjongtracker`）に変更が必須
- **手順**: `capacitor.config.json` の `appId` を変更 → `npx cap sync`

### HIGH: Androidプロジェクトが未生成
- **内容**: `android/` ディレクトリが存在しない
- **対応**: `npx cap add android` を実行してAndroidプロジェクトを生成
- **手順**:
  ```bash
  npx cap add android
  npx cap sync
  npx cap open android  # Android Studio で開く
  ```

### MEDIUM: アイコンがSVG形式のみ（PNG必須）
- **ファイル**: `manifest.json`, `icon-192.svg`, `icon-512.svg`
- **内容**: PlayストアはPNG形式のアイコン（512×512）が必須
- **対応**: SVGをPNGに変換し、`manifest.json` のアイコン設定を更新

### LOW: `updateTopStats()` が空実装
- **場所**: `index.html` line 1853
- **内容**: 関数が定義されているが何もしない（呼び出し元は複数箇所あり）
- **影響**: ヘッダー部分の統計表示が機能しない可能性（UI上の影響を要確認）

---

## 📋 Androidビルド・リリース手順（参考）

```bash
# 1. App IDを変更（capacitor.config.json）
# 2. Androidプロジェクト生成
npx cap add android

# 3. Webアセットを同期
npx cap sync android

# 4. Android Studioでビルド
npx cap open android
# → Build > Generate Signed Bundle/APK → AABファイル生成

# 5. Google Play Console にAABをアップロード
```

---

## 🧪 テストコマンド

```bash
# 全テスト実行
npx playwright test

# HTMLレポート表示
npx playwright show-report

# 特定フローのみ実行
npx playwright test tests/flow2-free-session.spec.js
```
