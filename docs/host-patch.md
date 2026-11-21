# 宿主补丁：让侧栏浏览器「记住登录」

> ⚠️ 本文档描述的是**修改已安装的 DeepSeek Harness 桌面版 `app.asar`**，属于非官方修改。
> 它会让应用的代码签名封印失效（ad-hoc 状态下仍可运行），且**每次 DSH 自动更新后都会被覆盖**。
> 请读完「风险与失效条件」再决定是否使用。作者不为改坏应用负责。

## 它解决什么

DSH 桌面版右侧栏的浏览器面板，登录态**不跨应用重启保留**——每次重开都要重新登录一遍。

根因在宿主主进程 `lib/main.js` 的 `DesktopBrowserGuests.acquire()`：

```js
partition = `dsh-sidebar-browser-${randomUUID()}`
```

没有 `persist:` 前缀的 partition 是**纯内存**分区，Cookie / localStorage / IndexedDB 全在进程里，
进程一退就没了。宿主自己是知道怎么持久的——平台账号窗口用的是
`persist:dsh-platform-${sha256(origin + userId)}`（同一文件，`partition` 的另一处出现）——
只有侧栏浏览器这一处漏了前缀。

补丁把它改成：

```js
partition = `persist:dsh-sidebar-browser`
```

于是 Electron 把该分区落到：

```
<userData>/Partitions/dsh-sidebar-browser/
```

macOS 上 `<userData>` 实测为 `~/Library/Application Support/@deepseek-ai/dsh-desktop`
（注意不是 `com.deepseek.dsh`——那是 bundle id，Electron 用的是应用自己传的 user-data-dir）。

落盘后可以核对：

```bash
P="$HOME/Library/Application Support/@deepseek-ai/dsh-desktop/Partitions/dsh-sidebar-browser"
sqlite3 "$P/Cookies" "select host_key, name, length(value) from cookies order by host_key;"
```

## 代价：所有工作区共用一个 Cookie 罐

原设计按 workspace（`cwd:<path>` 或 `session:<id>`）分配 partition，补丁后统一成一个。
造成的影响：

- **登录态全局共享**：在 A 会话登录 DeepSeek，B 会话也直接是登录态。对「登录一次，到处能用」
  这个目的而言是加分。
- **失去按工作区隔离**：如果将来需要「工作账号 A / 个人账号 B 并存」，这个改法做不到，
  得改成 `persist:dsh-sidebar-browser-${sha256(workspace)}`——但那会超出 48 字节预算，
  必须重写整个 asar header（见下）。

## 为什么是「等长改写」

这份 asar 长 210072818 字节，header JSON 占 5699236 字节，之后是文件数据。
Electron 的完整性校验（`Info.plist → ElectronAsarIntegrity → Resources/app.asar`）**只覆盖
header 区段** `bytes[headerStart .. dataOffset)`，不含文件内容——实测这段的 sha256 正是
plist 里记录的 `c2e8c435…`，而整文件哈希是另一个值。

于是有两条路：

| 方案 | 替换串长度 | 后果 |
| --- | --- | --- |
| **等长改写**（本补丁） | 49 → 49 字节（补 8 个空格） | header 一个字节没动，完整性哈希仍成立；只改 33 个字节 |
| 带 workspace 哈希 | 49 → 97 字节 | 必须平移后续**全部** 21826 个文件的 offset、重写 5.7MB header，并让完整性哈希失效 |

本补丁走前者。补的那 8 个空格落在模板串收尾反引号与分号之间，JS 合法：

```js
partition = `persist:dsh-sidebar-browser`        ;
//                                           ^^^^ 补的空格
```

> 另外：本机 Electron fuses 里 `EnableEmbeddedAsarIntegrityValidation` 是 **disabled**，
> `OnlyLoadAppFromAsar` 也是 **disabled**。也就是说这次改动不会被完整性校验拦下；
> 但补丁仍然遵守等长原则，以免将来这两项被打开时失效。

## 用法

```bash
# 1. 先看当前状态（不改任何文件）
node host-patch/patch-asar.mjs --status

# 2. 演练（打印将改什么，不写盘）
node host-patch/patch-asar.mjs --dry-run

# 3. 打补丁（首次会自动备份到 ~/.dsh-host-patch/app.orig.asar）
node host-patch/patch-asar.mjs

# 4. 完全退出 DSH（⌘Q，不是关窗口）后重新打开
```

脚本做的事：定位 asar 的 header → 在 `lib/main.js` 里确认目标片段**恰好出现 1 次** → 等长替换 →
回读校验（长度不变 / 旧片段消失 / 新片段存在 / header 哈希不变）→ 报告差异字节数。

预期输出（0.2.2-rc.5 实测）：

```
✓ 补丁已写入
  文件大小未变: 210072818 字节
  header 完整性哈希未变: c2e8c43521f5d6c5ea10142580aa171814623bcf52427f6bc351a9b551478506
  差异字节: 33
```

如果宿主版本变了、`main.js` 里找不到（或找到多份）目标片段，脚本会**直接失败退出**而不是硬改。

## 回滚

```bash
node host-patch/patch-asar.mjs --restore
```

从 `~/.dsh-host-patch/app.orig.asar` 还原，然后同样要 ⌘Q 重开。

手上有原始签名材料（`~/.dsh-host-patch/orig-signature/`，含 `_CodeSignature/CodeResources`
与主可执行文件）的话，还原后还需要把签名状态一并复原；不还原也能跑，只是 `codesign --verify`
会报资源封印失效。

## 签名会发生什么

改 asar 会让 `codesign --verify --strict` 报 `a sealed resource is missing or invalid`，
`spctl -a -vvv` 报 rejected。**这不影响本机启动**：

- 主可执行文件自身的签名完好；
- 应用没有 `com.apple.quarantine` 扩展属性（本机早已放行过一次）；
- 实测打完补丁直接 `open -a` 能正常启动到主进程。

如果出于某种原因需要重签，只重签**外层 bundle**、保留嵌套 helper 的原签名即可：

```bash
codesign --force --sign - --identifier com.deepseek.dsh \
         --entitlements ~/.dsh-host-patch/entitlements.plist \
         --options runtime "/Applications/DeepSeek Harness.app"
```

（`--deep` 会把嵌套 helper 也改成 ad-hoc，没必要；`disable-library-validation` 这个 entitlement
让 ad-hoc 状态下仍能加载 Electron Framework。）

## 风险与失效条件

- **自动更新会覆盖。** `Contents/Resources/app-update.yml` 指向
  `https://download.deepseek.com/dsh-desk/feeds/mac-arm64/`（nightly 通道），升级后 `app.asar`
  被整个替换，补丁消失，需要重跑一次脚本。
- **升级后目标片段可能变化。** 若 Apple/DeepSeek 改了这段源码，脚本会失败退出（这是设计如此），
  需要人工核对新版本 `main.js` 里的 `acquire()` 再调整脚本常量。
- **`lib/main.js` 的 per-file integrity 不再匹配。** asar header 里每个文件带
  `integrity.hash`（当前 `lib/main.js` 的旧值是 `83741811…bb25`）。目前没有强制校验，
  但若 fuse `EnableEmbeddedAsarIntegrityValidation` 将来被打开，这一项会失败。
- **不影响隔离策略。** `configureSession()` 里的权限/下载/设备一律拒绝、导航白名单等逻辑
  与 partition 是否持久无关——补丁只改变「cookie 存哪里」，不放松任何沙箱限制。
- **单实例锁。** 改完必须完全退出应用（`requestSingleInstanceLock()`），只关窗口不算。

## 卸载

```bash
node host-patch/patch-asar.mjs --restore
# 然后 ⌘Q 重开
```

想同时清掉已落盘的登录数据：

```bash
rm -rf "$HOME/Library/Application Support/@deepseek-ai/dsh-desktop/Partitions/dsh-sidebar-browser"
```
