# dsh-deepseek-web — DeepSeek 网页版一键入口

在 **DeepSeek Harness 桌面版**的侧边栏底部加一个 **「DeepSeek 网页版」** 按钮：点一下，右侧边栏的浏览器 tab 就打开
`https://chat.deepseek.com`（免费网页版），和当前会话并排。

> 动机：简单问题不想走 API 计费，但又不想每次手动开浏览器、找网址、切窗口。

英文速览见 [English quickstart](#english-quickstart)。

## 为什么不是 iframe

| 方案 | 结论 |
| --- | --- |
| 把网页版 `<iframe>` 嵌进 GUI | ❌ 不可行。`chat.deepseek.com` 响应头带 `content-security-policy: frame-ancestors 'none'`，浏览器会拒绝渲染 |
| 反向代理剥掉 CSP | ⚠️ 能绕过，但要自己处理登录、WAF（`HWWAFSESID`）、SSE 流、证书与资源改写，脆且慢 |
| **用 DSH 桌面版自带的右侧栏浏览器面板** | ✅ 采用。它用 Electron `<webview>`（独立 Chromium guest）承载页面，**`frame-ancestors` 对 guest 不生效**；本插件只是省掉「每次手输网址」 |

面板本体是 DSH 内置插件 `@deepseek-ai/dsh-client-ui-sidebar-browser`（**desktop profile 默认启用**）。
本包只做一件事——调用它的公开入口：

```js
ctx.sidebarRight.openTab("browser", { params: { url: "https://chat.deepseek.com" } })
```

打开失败时（非桌面端、右侧栏服务不可用）自动退回 `window.open`，桌面端由主进程
`setWindowOpenHandler` → `shell.openExternal` 转给系统浏览器，不会「点了没反应」。

## 要求

- DeepSeek Harness **桌面版**（Electron），使用 `desktop` profile；
- 内置的右侧栏浏览器面板可用（桌面版默认启用，无需单独安装）。

已验证环境：macOS + DSH 桌面版 + desktop profile。Web profile 下右侧栏浏览器用的是
`<iframe sandbox=...>`，`frame-ancestors 'none'` 依然生效，因此这个入口在纯 Web profile 里
只会走系统浏览器回退路径。

## 安装

```bash
git clone https://github.com/zhanghao3693/dsh-deepseek-web.git ~/Documents/dsh-deepseek-web
bash ~/Documents/dsh-deepseek-web/install.sh          # 默认 desktop profile
# bash ~/Documents/dsh-deepseek-web/install.sh web    # 或指定 profile 名
```

脚本幂等，做三件事：建 symlink → 补 profile 的 `dependencies` + `dsh.profile.bundles` → 打印重启提示。
**然后需要重启一次 DSH 宿主**（点左侧栏底部的「重启」按钮，或重开应用），生效后左侧栏底部出现「DeepSeek 网页版」。

host 侧的挂载行由本包自带的 `cordis.patch.yml` 通过 `dsh.bundle.patch` 提供，
**不要**再往 profile 自己的 `cordis.patch.yml` 里写 `insert`（会重复挂载出两个按钮）。

## 卸载

```bash
PKG="$HOME/.dsh/profiles/desktop/package.json"
# 1. 从 $PKG 的 dependencies 与 dsh.profile.bundles 里删掉 "dsh-deepseek-web"
# 2. rm "$HOME/.dsh/profiles/desktop/node_modules/dsh-deepseek-web"
# 3. 重启 DSH
```

## 已知代价

- **登录不跨应用重启保留。** 桌面版给这个面板分配的存储分区是
  `dsh-sidebar-browser-${randomUUID()}`（进程内创建、没有 `persist:` 前缀），Cookie 只活在本次进程里。
  每次重启 DeepSeek Harness 后需要重新登录一次 `chat.deepseek.com`。好消息是 tab 的标题/URL 会被
  保存，重启后点「恢复」即可，不用重输网址。
- 面板里是**真正的网页版，没有 API**：DSH 的模型路由无法自动把「简单问题」转发过去。
  这条入口是给**手动**问免费问题时用的。

## 文件

| 文件 | 作用 |
| --- | --- |
| `lib/index.js` | host 半边（stub：`name` + 空 `apply`），cordis loader 需要一个服务端入口 |
| `lib/client.js` | 浏览器半边：注册 `sidebar.footer.action` 槽位的入口按钮（`id: deepseek-web`，`order: 15`） |
| `cordis.patch.yml` | bundle patch：`insert: [{ id: deepseek-web, name: dsh-deepseek-web }]` |
| `locale/zh.json` / `locale/en.json` | 插件说明书元信息（供插件清单类界面读取） |
| `install.sh` | 装/校验 profile 挂载 |

改目标网址：编辑 `lib/client.js` 里的 `DEEPSEEK_WEB_URL`。

## 关键常量（排障用）

- 浏览器页类型 kind：`"browser"`（`BROWSER_KIND`，见 `@deepseek-ai/dsh-client-ui-sidebar-browser/lib/client.js`）
- 传参形状：`tab.navigation.params.url`
- 槽位：`sidebar.footer.action`（list；注册字段 `id` / `order` / `label`，渲染 props `{ t, wide }`）
- 入口 id：`deepseek-web`；order `15`（夹在 `dpharness` = 12 与 `restart` = 20 之间）
- `sidebarRight` 服务**故意不写进 `inject`**，改为惰性解析：服务缺失时只回退，不会让插件永久
  pending（`dsh-locale-fallback` 曾因声明了缺失的 inject 把整个 boot 拖挂）

## English quickstart

A one-click sidebar entry for **DeepSeek Harness Desktop**: it opens the free
`https://chat.deepseek.com` web chat inside DSH's built-in right-sidebar browser panel,
side by side with your current session.

- The built-in panel (`@deepseek-ai/dsh-client-ui-sidebar-browser`, enabled by default in the
  `desktop` profile) renders pages in an Electron `<webview>` — an isolated Chromium guest — so
  `chat.deepseek.com`'s `content-security-policy: frame-ancestors 'none'` does **not** apply
  (it only blocks `<iframe>` embedding).
- This package just calls the panel's public API:
  `ctx.sidebarRight.openTab("browser", { params: { url: "https://chat.deepseek.com" } })`,
  falling back to `window.open` when the sidebar service is unavailable.

```bash
git clone https://github.com/zhanghao3693/dsh-deepseek-web.git ~/Documents/dsh-deepseek-web
bash ~/Documents/dsh-deepseek-web/install.sh
# then restart the DSH host (restart button at the sidebar foot, or relaunch the app)
```

Caveat: cookies for that panel live in an in-memory partition
(`dsh-sidebar-browser-${randomUUID()}`), so you must log in to `chat.deepseek.com` again after each
app restart. It is the real web app, with no API — DSH's model router cannot dispatch to it
automatically.

## License

MIT — 见 [LICENSE](./LICENSE)。
