# dsh-deepseek-web — 网页版 AI 一键入口

在 **DeepSeek Harness 桌面版**的侧边栏底部加一个 **「网页版 AI」** 按钮：点一下展开站点列表，
选中哪家就在**右侧边栏的浏览器 tab** 里打开它的免费网页版，和当前会话并排。

默认六站：**DeepSeek 网页版 · Kimi · 豆包 · 腾讯元宝 · 通义千问 · 智谱清言**（可自由增删，见下）。

> 动机：简单问题不想走 API 计费，但又不想每次手动开浏览器、找网址、切窗口。

英文速览见 [English quickstart](#english-quickstart)。

## 为什么不是 iframe

| 方案 | 结论 |
| --- | --- |
| 把网页版 `<iframe>` 嵌进 GUI | ❌ 不可行。`chat.deepseek.com` 等站点响应头带 `content-security-policy: frame-ancestors 'none'`，浏览器会拒绝渲染 |
| 反向代理剥掉 CSP | ⚠️ 能绕过，但要自己处理登录、WAF（`HWWAFSESID`）、SSE 流、证书与资源改写，脆且慢 |
| **用 DSH 桌面版自带的右侧栏浏览器面板** | ✅ 采用。它用 Electron `<webview>`（独立 Chromium guest）承载页面，**`frame-ancestors` 对 guest 不生效**；本插件只负责省掉「每次手输网址」 |

面板本体是 DSH 内置插件 `@deepseek-ai/dsh-client-ui-sidebar-browser`（**desktop profile 默认启用**）。
本包只做一件事——调用它的公开入口：

```js
ctx.sidebarRight.openTab("browser", { params: { url: "https://chat.deepseek.com" } })
```

打开失败时（非桌面端、右侧栏服务不可用）自动退回 `window.open`，桌面端由主进程
`setWindowOpenHandler` → `shell.openExternal` 转给系统浏览器，不会「点了没反应」——
而且回退时带的是**你选中的那一站**，不是写死的默认站。

## 站点列表

站点就是 [`lib/client.js`](./lib/client.js) 顶部的 `SITES` 常量，**整个配置面就这一个数组**，
顺序 = 菜单顺序，第一项是默认站点。加一站就追加一行：

```js
const SITES = [
  { id: "deepseek", label: "DeepSeek 网页版", url: "https://chat.deepseek.com" },
  // { id: "chatgpt", label: "ChatGPT", url: "https://chatgpt.com" },
];
```

已收录站点的本机探活结果（Chrome UA，curl 层）：

| 站点 | 结果 | | 站点 | 结果 |
| --- | --- | --- | --- | --- |
| chat.deepseek.com | 200 | | doubao.com | 200 |
| kimi.com | 200 | | yuanbao.tencent.com | 200 |
| chat.qwen.ai | 200 | | chatglm.cn | 200 |
| chatgpt.com | 403 | | claude.ai | 403 |
| perplexity.ai | 403 | | | |

**403 别急着下结论**：那是 curl 撞上 Cloudflare 机器人拦截，不代表浏览器里打不开。
ChatGPT / Claude / Gemini 默认在代码里**注释掉**了，用之前请在面板里实测后自行放开。

### 图标

菜单里每一站显示的是**各家的品牌图标**，以 data URI 内联在 [`lib/client.js`](./lib/client.js) 的
`ICONS` 常量里——不热链、不发额外请求、离线可用：

- DeepSeek 用官方 `favicon.svg`（单色 `#4D6BFE`），其余五站用各家 favicon 归一化成 48×48 PNG8（每张 0.8–1.6 KB）；
- 图标版权归各家所有，此处仅用于标识对应服务；
- `ICONS` 里没有条目的站点**自动退回通用地球图标**，所以新加站点不配图标也不会缺图——
  想换成品牌图标，往 `ICONS` 里补一条 `"站点 id": "data:image/png;base64,…"` 即可。

### 站点侧的硬限制

guest 的权限请求、下载、原生弹窗**全被拒绝**（http/https 弹窗会被转开成新的 sidebar tab）。

- 用 **Google / Apple 账号第三方登录**的站点（ChatGPT、Gemini 常见）可能卡在 OAuth 流程；
- 少数站点会识别 Electron UA 而给出不同的页面；
- 这些都不影响「已经登录过的站点」——它们靠的是 guest 自己的会话 Cookie。

## 要求

- DeepSeek Harness **桌面版**（Electron），使用 `desktop` profile；
- 内置的右侧栏浏览器面板可用（桌面版默认启用，无需单独安装）。

已验证环境：macOS + DSH 桌面版 + desktop profile。Web profile 下右侧栏浏览器用的是
`<iframe sandbox=...>`，`frame-ancestors 'none'` 依然生效，因此这个入口在纯 Web profile 里
只会走系统浏览器回退路径。

## 安装

**方式一：npm 包（推荐，装完即可升级）**

```bash
dsh plugin --profile desktop add @dpharness/dsh-deepseek-web
```

> 包名是 scoped 的 `@dpharness/dsh-deepseek-web`。**不要**装 npm 上的 `dsh-deepseek-web`
> —— 那个同名包属于另一位作者（`y-wi`），与本项目无关，功能也不同。

**方式二：从仓库挂本地目录（改代码时用）**

```bash
git clone https://github.com/zhanghao3693/dsh-deepseek-web.git ~/Documents/dsh-deepseek-web
bash ~/Documents/dsh-deepseek-web/install.sh          # 默认 desktop profile
# bash ~/Documents/dsh-deepseek-web/install.sh web    # 或指定 profile 名
```

脚本幂等，做三件事：建 symlink → 补 profile 的 `dependencies` + `dsh.profile.bundles` → 打印重启提示。
**然后需要重启一次 DSH 宿主**（点左侧栏底部的「重启」按钮，或重开应用），生效后左侧栏底部出现「网页版 AI」。

> ⚠️ 2026-10-17 起包名由 `dsh-deepseek-web` 改为 `@dpharness/dsh-deepseek-web`（原名在 npm 上被占用）。
> 从旧版升级时，请把 profile `package.json` 的 `dependencies` 与 `dsh.profile.bundles` 里的
> **旧键删掉**，再按上面任一方式安装；否则会重复挂载。

host 侧的挂载行由本包自带的 `cordis.patch.yml` 通过 `dsh.bundle.patch` 提供，
**不要**再往 profile 自己的 `cordis.patch.yml` 里写 `insert`（会重复挂载出两个按钮）。

## 卸载

```bash
PKG="$HOME/.dsh/profiles/desktop/package.json"
# 1. 从 $PKG 的 dependencies 与 dsh.profile.bundles 里删掉 "@dpharness/dsh-deepseek-web"
#    （若从旧版升级，旧键 "dsh-deepseek-web" 也要删）
# 2. rm "$HOME/.dsh/profiles/desktop/node_modules/@dpharness/dsh-deepseek-web"
# 3. 重启 DSH
```

## 已知代价

- **登录不跨应用重启保留。** 桌面版给这个面板分配的存储分区是
  `dsh-sidebar-browser-${randomUUID()}`（进程内创建、没有 `persist:` 前缀），Cookie 只活在本次进程里。
  每次重启 DeepSeek Harness 后需要重新登录一次。好消息是 tab 的标题/URL 会被保存，
  重启后点「恢复」即可，不用重输网址。
- 面板里是**真正的网页版，没有 API**：DSH 的模型路由无法自动把「简单问题」转发过去。
  这条入口是给**手动**问免费问题时用的；要做 API 侧的分流请走 `@deepseek-ai/dsh-llm-pi-ai` 的路由配置。

## 文件

| 文件 | 作用 |
| --- | --- |
| `lib/index.js` | host 半边（stub：`name` + 空 `apply`），cordis loader 需要一个服务端入口 |
| `lib/client.js` | 浏览器半边：`SITES` 站点表 + `ICONS` 品牌图标表 + 注册 `sidebar.footer.action` 槽位的入口按钮（`id: deepseek-web`，`order: 15`） |
| `cordis.patch.yml` | bundle patch：`insert: [{ id: deepseek-web, name: dsh-deepseek-web }]` |
| `locale/zh.json` / `locale/en.json` | 插件说明书元信息（供插件清单类界面读取） |
| `install.sh` | 装/校验 profile 挂载 |

## 关键常量（排障用）

- 浏览器页类型 kind：`"browser"`（`BROWSER_KIND`，见 `@deepseek-ai/dsh-client-ui-sidebar-browser/lib/client.js`）
- 传参形状：`tab.navigation.params.url`
- 槽位：`sidebar.footer.action`（list；注册字段 `id` / `order` / `label`，渲染 props `{ t, wide }`）
- 入口 id：`deepseek-web`；order `15`（夹在 `dpharness` = 12 与 `restart` = 20 之间）
- `sidebarRight` 服务**故意不写进 `inject`**，改为惰性解析：服务缺失时只回退，不会让插件永久
  pending（`dsh-locale-fallback` 曾因声明了缺失的 inject 把整个 boot 拖挂）
- 站点图标：`siteIcon(site, size)` 先查 `ICONS[site.id]`（data URI → 内联 `<img className="dswb_icon">`），
  没有才走「通用图标」解析链 `IconNewChatOutlineRegular` → `...Medium` → `...20` → `IconGlobeOutline*`
  → `...Medium` → `...14`；整条链全都没有时返回 `null` 而不是 `undefined`——渲染期抛错会被 slot 的
  错误边界吃掉，表现为「按钮静默消失」
- 展开态用 `useState` + 点击外部/Escape 关闭（`document` 上的 capture 阶段 click 监听），
  不依赖任何 popover/Menu 组件，因此不受侧边栏 `overflow` 裁剪影响

## English quickstart

A one-click multi-site entry for **DeepSeek Harness Desktop**: it opens a free web AI chat
(DeepSeek / Kimi / Doubao / Yuanbao / Qwen / ChatGLM) inside DSH's built-in right-sidebar browser
panel, side by side with your current session.

- The built-in panel (`@deepseek-ai/dsh-client-ui-sidebar-browser`, enabled by default in the
  `desktop` profile) renders pages in an Electron `<webview>` — an isolated Chromium guest — so
  `content-security-policy: frame-ancestors 'none'` does **not** apply (it only blocks `<iframe>`
  embedding).
- This package just calls the panel's public API:
  `ctx.sidebarRight.openTab("browser", { params: { url } })`, falling back to `window.open` when the
  sidebar service is unavailable.
- The site list is the `SITES` array at the top of [`lib/client.js`](./lib/client.js).
- Each site shows its own brand icon, inlined as a data URI in the `ICONS` map of the same file — no
  hotlinking, no extra requests, works offline; a site with no `ICONS` entry falls back to a generic
  globe glyph.

```bash
# npm（推荐）
dsh plugin --profile desktop add @dpharness/dsh-deepseek-web
# 或从仓库挂本地目录
git clone https://github.com/zhanghao3693/dsh-deepseek-web.git ~/Documents/dsh-deepseek-web
bash ~/Documents/dsh-deepseek-web/install.sh
# then restart the DSH host (restart button at the sidebar foot, or relaunch the app)
```

Caveats: cookies for that panel live in an in-memory partition
(`dsh-sidebar-browser-${randomUUID()}`), so you must log in again after each app restart; guest
permission requests, downloads and native popups are denied (http/https popups become new sidebar
tabs), so OAuth-via-popup logins may not complete. It is the real web app, with no API — DSH's
model router cannot dispatch to it automatically.

## License

MIT — 见 [LICENSE](./LICENSE)。
