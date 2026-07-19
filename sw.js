// 成长花园 Service Worker
// 作用：让“添加到主屏幕”的图标（iOS 独立模式）始终加载最新的 index.html，
// 避免 iOS 把旧版 HTML 长期缓存在主屏图标里导致功能“回退/无反应”。
// 策略：同源的“页面外壳”请求（导航到首页/index.html）走【网络优先】，失败再回退缓存；
//       跨域请求（GitHub API 等）与其它静态资源交给浏览器默认处理，不拦截。
const CACHE = "garden-shell-v1";
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
    fetch(req).then(function (res) {
      const copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {});
      return res;
    }).catch(function () { return caches.match(req).then(function (r) { return r || fetch(req); }); })
  );
});
