#!/bin/bash
# install.sh — 把「DeepSeek 网页版」一键入口挂进 DSH profile。
#
# 用法：
#   bash install.sh              # 默认挂进 desktop profile
#   bash install.sh web          # 指定 profile 名
#
# 做三件事（幂等，可反复执行）：
#   1. 在 profile 的 node_modules 里放一个指向本目录的 symlink
#   2. 在 profile 的 package.json 里补 dependencies + dsh.profile.bundles
#   3. 打印重启提示（重启由你决定，脚本不会动正在运行的宿主）
#
# 插件的 host 行由本包自带的 cordis.patch.yml 通过 dsh.bundle.patch 挂载，
# 所以 **不需要** 也不应该再往 profile 自己的 cordis.patch.yml 里写 insert。

set -euo pipefail

PLUGIN_NAME="dsh-deepseek-web"
PLUGIN_SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROFILE_NAME="${1:-desktop}"
PROFILE_DIR="$HOME/.dsh/profiles/$PROFILE_NAME"
NM="$PROFILE_DIR/node_modules"
PKG="$PROFILE_DIR/package.json"

if [ ! -f "$PKG" ]; then
	echo "❌ 找不到 profile: $PROFILE_DIR" >&2
	echo "   可用 profile: $(ls -1 "$HOME/.dsh/profiles" 2>/dev/null | tr '\n' ' ')" >&2
	exit 1
fi

echo "==> profile: $PROFILE_DIR"

echo "==> 1/3 symlink 插件到 profile node_modules ..."
mkdir -p "$NM"
LINK_TARGET="$PLUGIN_SRC"
rm -rf "$NM/$PLUGIN_NAME"
ln -s "$LINK_TARGET" "$NM/$PLUGIN_NAME"
echo "     $NM/$PLUGIN_NAME -> $LINK_TARGET"

echo "==> 2/3 注册到 profile package.json（dependencies + dsh.profile.bundles）..."
if ! command -v node >/dev/null 2>&1; then
	echo "⚠️  未找到 node，请手动把 \"$PLUGIN_NAME\": \"link:$PLUGIN_SRC\" 加进 $PKG 的 dependencies，"
	echo "    并把 \"$PLUGIN_NAME\" 追加进 dsh.profile.bundles" >&2
	exit 1
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
cp "$PKG" "$PKG.bak-$PLUGIN_NAME-$STAMP"
echo "     已备份: $PKG.bak-$PLUGIN_NAME-$STAMP"

PKG="$PKG" PLUGIN_NAME="$PLUGIN_NAME" PLUGIN_SRC="$PLUGIN_SRC" node --input-type=module -e '
import { readFileSync, writeFileSync } from "node:fs";
const path = process.env.PKG;
const name = process.env.PLUGIN_NAME;
const src = process.env.PLUGIN_SRC;
const pkg = JSON.parse(readFileSync(path, "utf8"));
pkg.dependencies ??= {};
pkg.dependencies[name] = `link:${src}`;
const bundles = (pkg.dsh ??= {}).profile?.bundles;
if (!Array.isArray(bundles)) throw new Error("dsh.profile.bundles 不是数组，已中止");
if (!bundles.includes(name)) bundles.push(name);
writeFileSync(path, JSON.stringify(pkg, null, 2) + "\n");
console.log("     dependencies + bundles 已更新");
'

echo "==> 3/3 完成。请重启 DSH 宿主以生效："
echo "     - 点击左侧栏底部的「重启」按钮，或"
echo "     - 退出并重新打开 DeepSeek Harness 应用"
echo ""
echo "     生效后：左侧栏底部出现「DeepSeek 网页版」按钮，"
echo "     点击即在右侧边栏浏览器 tab 打开 chat.deepseek.com"
echo ""
echo "     卸载：把 \"$PLUGIN_NAME\" 从 $PKG 的 dependencies 与 dsh.profile.bundles 中删除，"
echo "           再删掉 $NM/$PLUGIN_NAME 这个 symlink，重启即可。"
