// 🌱 成长花园 · Supabase 反向代理（Cloudflare Worker）
// -------------------------------------------------------------
// 作用：内地手机直连 *.supabase.co 会被 DNS 污染（无法解析，报“找不到服务器”），
//       本 Worker 部署在 Cloudflare 上（内地可直连），由它转发到 Supabase。
// 部署后你会免费获得一个“代理地址”，形如：
//        https://growth-garden-proxy.你的用户名.workers.dev
// 把这个地址发给我，我写进 App 的 SUPABASE_URL，即可全家云端同步。
//
// 部署步骤（全程网页操作，无需装环境、无需绑卡）：
//   1) 打开 https://dash.cloudflare.com → 注册/登录（免费）
//   2) 左侧「Workers 和 Pages」→「创建」→「创建 Worker」
//   3) 名称随便填（如 growth-garden-proxy），把本文件内容**全部替换**进去
//   4) 点「部署」→ 完成后点「访问」即可看到你的 *.workers.dev 地址
//   5) 把该地址（含 https://）发给我，我写进 App 即可
// -------------------------------------------------------------

// 👇 你的 Supabase 项目域名（Project URL 里 supabase.co 前面那段，已核对正确）
const SUPABASE_HOST = "crsuctkvtbpbprpphyel.supabase.com";

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // 只代理 REST 接口，其他一律拒绝（最小暴露面）
    if (!url.pathname.startsWith("/rest/v1")) {
      return new Response("Only /rest/v1 is proxied", { status: 404 });
    }

    // 改写目标主机；路径、查询参数、请求体原样转发
    url.hostname = SUPABASE_HOST;
    url.protocol = "https:";

    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.set("host", SUPABASE_HOST);

    const init = {
      method: request.method,
      headers,
      redirect: "follow",
      body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
    };

    const resp = await fetch(url.toString(), init);

    // 补上 CORS 头，确保 GitHub Pages（跨域）页面能正常调用
    const out = new Headers(resp.headers);
    out.set("access-control-allow-origin", "*");
    out.set("access-control-allow-headers", "apikey, authorization, content-type, prefer");
    out.set("access-control-allow-methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
    out.set("access-control-expose-headers", "Content-Range");

    return new Response(resp.body, { status: resp.status, headers: out });
  },
};
