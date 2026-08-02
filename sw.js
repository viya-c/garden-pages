// 成长花园 Service Worker
// 作用：让“添加到主屏幕”的图标（iOS 独立模式）加载更快、且始终能更新。
// 策略（stale-while-revalidate）：同源“页面外壳”请求（导航到首页/index.html）有缓存立即返回，
//       让【后续加载秒开】；同时后台静默拉取最新版写入缓存，下一次加载即生效。
//       首次访问（缓存为空）走网络拿到最新版并写入缓存。跨域请求（GitHub API 等）不拦截。
//       换版本时 CACHE 常量升号，旧缓存失效、新版首次即拉取，避免“回退/无反应”。
const CACHE = "garden-shell-v7";
self.addEventListener("install", function (e) { self.skipWaiting(); });
self.addEventListener("activate", function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", function (e) {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const isShell = url.origin === self.location.origin &&
    (req.mode === "navigate" || url.pathname.endsWith("/index.html") || url.pathname.endsWith("/"));
  if (!isShell) return;
  e.respondWith(
    caches.open(CACHE).then(function (cache) {
      return cache.match(req).then(function (cached) {
        const network = fetch(req).then(function (res) {
          if (res && res.status === 200) cache.put(req, res.clone());
          return res;
        }).catch(function () { return cached; });
        // 有缓存立即返回（首访后秒开），无缓存再走网络
        return cached || network;
      });
    })
  );
});
