const CACHE_NAME = 'mahjong-score-v1';

// キャッシュするファイル一覧
const STATIC_ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg'
];

// Google Fonts のキャッシュ用ドメイン
const FONT_DOMAINS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

// インストール時：静的ファイルをキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// アクティベート時：古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// フェッチ時：キャッシュ戦略
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Google Fonts → キャッシュ優先（オフライン対応）
  if (FONT_DOMAINS.some(d => url.hostname.includes(d))) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(response => {
            cache.put(event.request, response.clone());
            return response;
          }).catch(() => cached);
        })
      )
    );
    return;
  }

  // アプリ本体 → キャッシュ優先、なければネットワーク
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // 正常なレスポンスのみキャッシュ
        if (response && response.status === 200 && response.type === 'basic') {
          const toCache = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, toCache));
        }
        return response;
      }).catch(() => {
        // オフライン時はindex.htmlを返す
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
