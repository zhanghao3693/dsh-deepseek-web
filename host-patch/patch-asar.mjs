#!/usr/bin/env node
/*
 * patch-asar.mjs — 让 DSH 桌面版的「侧栏浏览器」面板使用持久化存储分区。
 *
 * 背景：宿主 main.js 里 DesktopBrowserGuests.acquire() 用
 *     partition = `dsh-sidebar-browser-${randomUUID()}`
 * 创建 guest 分区，没有 `persist:` 前缀 → Cookie 只活在进程内存里，重启即登出。
 * 本脚本把它等长改写为
 *     partition = `persist:dsh-sidebar-browser`
 * 于是 Electron 把分区落到 <userData>/Partitions/dsh-sidebar-browser/。
 *
 * 为什么必须「等长」：
 *   app.asar 的完整性哈希（Info.plist → ElectronAsarIntegrity）只覆盖 header 区段
 *   bytes[headerStart .. dataOffset)，不含文件内容（实测 c2e8c435… 命中的正是这一段）。
 *   只要 header 一个字节都不动，替换后该哈希依然成立；
 *   改长度就必须平移全表 offset 并重写 header，风险陡增。
 *
 * 用法：
 *   node patch-asar.mjs                      # 自动定位已安装的 app，打补丁
 *   node patch-asar.mjs --app "/path/X.app"  # 指定 app
 *   node patch-asar.mjs --dry-run            # 只检查、不写
 *   node patch-asar.mjs --restore            # 从备份还原
 *   node patch-asar.mjs --status             # 只看当前状态
 *
 * 退出码：0 成功 / 1 失败 / 2 用法错误
 */

import fs from "node:fs";
import { createHash } from "node:crypto";
import { homedir } from "node:os";
import { join } from "node:path";

const TARGET = "partition = `dsh-sidebar-browser-${randomUUID()}`";
const REPLACEMENT = "partition = `persist:dsh-sidebar-browser`";

const DEFAULT_APP = "/Applications/DeepSeek Harness.app";
const BACKUP_DIR = join(homedir(), ".dsh-host-patch");
const BACKUP_PATH = join(BACKUP_DIR, "app.orig.asar");

const HELP = `patch-asar.mjs — 给 DSH 桌面版的侧栏浏览器打持久化分区补丁

  node patch-asar.mjs [选项]

选项：
  --app <path>   指定 .app 路径（默认 ${DEFAULT_APP}）
  --dry-run      只检查与演练，不写文件
  --restore      从备份还原 app.asar
  --status       只报告当前是原始态还是补丁态
  -h, --help     显示本帮助

备份位置：${BACKUP_PATH}（首次打补丁时自动生成，之后不再覆盖）
`;

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

function die(msg) {
	console.error(`✗ ${msg}`);
	process.exit(1);
}

function parseArgs(argv) {
	const opts = { app: DEFAULT_APP, dryRun: false, restore: false, status: false, help: false };
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === "--app") {
			const v = argv[++i];
			if (!v) die("--app 需要一个路径参数");
			opts.app = v;
		} else if (a === "--dry-run") opts.dryRun = true;
		else if (a === "--restore") opts.restore = true;
		else if (a === "--status") opts.status = true;
		else if (a === "-h" || a === "--help") opts.help = true;
		else die(`未知参数: ${a}（用 --help 看用法）`);
	}
	return opts;
}

/** 按 asar 规范解析 header：定位 \`{"files"\`，括号配对求 JSON 结束位置。 */
function readAsarHeader(buf) {
	const headerStart = buf.indexOf(Buffer.from('{"files"'));
	if (headerStart < 0) die("这不是一个 asar 文件（找不到 header）");

	let depth = 0;
	let end = -1;
	let inStr = false;
	let esc = false;
	for (let i = headerStart; i < buf.length; i++) {
		const c = buf[i];
		if (inStr) {
			if (esc) esc = false;
			else if (c === 0x5c) esc = true;
			else if (c === 0x22) inStr = false;
			continue;
		}
		if (c === 0x22) inStr = true;
		else if (c === 0x7b) depth++;
		else if (c === 0x7d) {
			depth--;
			if (depth === 0) {
				end = i;
				break;
			}
		}
	}
	if (end < 0) die("asar header 解析失败（JSON 未闭合）");

	const header = JSON.parse(buf.subarray(headerStart, end + 1).toString("utf8"));
	// dataOffset = 8 字节 pickle 头 + header 长度字段（已含 4 字节对齐余量）
	const dataOffset = 8 + buf.readUInt32LE(4);
	return { header, headerStart, dataOffset };
}

/** 在 header 树里按路径找节点。 */
function findByPath(header, wanted) {
	let node = header;
	for (const part of wanted.split("/")) {
		node = node?.files?.[part];
		if (!node) return null;
	}
	return node;
}

function locateAsar(appPath) {
	const p = join(appPath, "Contents", "Resources", "app.asar");
	if (!fs.existsSync(p)) die(`找不到 ${p}\n  请用 --app 指定正确的 .app 路径`);
	return p;
}

function main() {
	const opts = parseArgs(process.argv.slice(2));
	if (opts.help) {
		process.stdout.write(HELP);
		return;
	}

	const asarPath = locateAsar(opts.app);
	console.log(`asar: ${asarPath}`);

	// ---------- restore ----------
	if (opts.restore) {
		if (!fs.existsSync(BACKUP_PATH)) die(`没有备份可还原：${BACKUP_PATH}`);
		const orig = fs.readFileSync(BACKUP_PATH);
		const cur = fs.readFileSync(asarPath);
		console.log(`备份: ${orig.length} 字节  sha256=${sha256(orig)}`);
		console.log(`线上: ${cur.length} 字节  sha256=${sha256(cur)}`);
		if (orig.equals(cur)) {
			console.log("✓ 线上文件已与备份一致，无需还原。");
			return;
		}
		if (opts.dryRun) {
			console.log("(--dry-run) 未写入");
			return;
		}
		const tmp = `${asarPath}.restoring`;
		fs.writeFileSync(tmp, orig);
		fs.renameSync(tmp, asarPath);
		console.log("✓ 已还原为原始 app.asar。完全退出并重开 DSH 生效。");
		return;
	}

	// ---------- read + locate ----------
	const buf = fs.readFileSync(asarPath);
	const { header, headerStart, dataOffset } = readAsarHeader(buf);
	// 完整性哈希覆盖 range [headerStart, dataOffset)：前面 8/12/16 字节的 pickle 头不在其中
	const integrity = sha256(buf.subarray(headerStart, dataOffset));

	const entry = findByPath(header, "lib/main.js");
	if (!entry || entry.size === undefined) die("asar 里找不到 lib/main.js");
	if (entry.unpacked) die("lib/main.js 是 unpacked 的，本脚本不支持");

	const fileStart = dataOffset + Number(entry.offset);
	const fileEnd = fileStart + Number(entry.size);
	if (fileEnd > buf.length) die(`lib/main.js 区段越界（${fileEnd} > ${buf.length}）`);

	const patched = buf.subarray(fileStart, fileEnd).includes(Buffer.from(REPLACEMENT));

	console.log(`header 区段 sha256=${integrity}`);
	console.log(`  （应与 Info.plist → ElectronAsarIntegrity → Resources/app.asar 的 hash 一致）`);
	console.log(`lib/main.js [${fileStart}, ${fileEnd}) ${entry.size} 字节`);	console.log(`当前状态: ${patched ? "已打补丁" : "原始态"}`);

	if (opts.status) return;
	if (patched) {
		console.log("✓ 已是补丁态，无需改动。");
		return;
	}

	// ---------- find the single target ----------
	const needle = Buffer.from(TARGET);
	const hits = [];
	for (let i = fileStart; i < fileEnd; i++) {
		if (buf[i] !== needle[0]) continue;
		if (buf.compare(needle, 0, needle.length, i, i + needle.length) === 0) hits.push(i);
	}
	if (hits.length !== 1) {
		die(
			`目标片段在 lib/main.js 里出现 ${hits.length} 次（期望恰好 1 次）。\n` +
				`  宿主版本可能已变，源码结构与本脚本假设不符。请勿硬改，先人工核对 main.js 里 acquire()。\n` +
				`  目标片段: ${TARGET}`,
		);
	}

	const pad = " ".repeat(Buffer.byteLength(TARGET) - Buffer.byteLength(REPLACEMENT));
	const replacement = REPLACEMENT + pad;
	if (Buffer.byteLength(replacement) !== Buffer.byteLength(TARGET)) die("内部错误：替换串长度不一致");
	if (pad.length < 0) die("内部错误：替换串比目标串长");

	console.log(`命中偏移 ${hits[0]}（main.js 内 ${hits[0] - fileStart}）`);
	console.log(`  - ${TARGET}`);
	console.log(`  + ${replacement.trimEnd()}${pad ? `（补 ${pad.length} 个空格）` : ""}`);

	if (opts.dryRun) {
		console.log("(--dry-run) 未写入任何文件");
		return;
	}

	// ---------- backup once ----------
	fs.mkdirSync(BACKUP_DIR, { recursive: true });
	if (!fs.existsSync(BACKUP_PATH)) {
		fs.copyFileSync(asarPath, BACKUP_PATH);
		console.log(`备份 → ${BACKUP_PATH}`);
	} else {
		console.log(`备份已存在（保留最初的原始件）: ${BACKUP_PATH}`);
	}

	// ---------- write ----------
	const out = Buffer.from(buf);
	out.write(replacement, hits[0], "utf8");
	const tmp = `${asarPath}.patched`;
	fs.writeFileSync(tmp, out);
	fs.renameSync(tmp, asarPath);

	// ---------- verify ----------
	const v = fs.readFileSync(asarPath);
	if (v.length !== buf.length) die(`文件长度变了: ${buf.length} → ${v.length}`);
	if (v.includes(needle)) die("旧片段仍存在于文件中");
	if (!v.includes(Buffer.from(replacement))) die("新片段未写入");
	const integrityAfter = sha256(v.subarray(headerStart, dataOffset));
	if (integrityAfter !== integrity) die("header 区段哈希变了 —— 不应发生，请立刻 --restore");

	let differing = 0;
	for (let i = 0; i < buf.length; i++) if (buf[i] !== v[i]) differing++;

	console.log("");
	console.log("✓ 补丁已写入");
	console.log(`  文件大小未变: ${v.length} 字节`);
	console.log(`  header 完整性哈希未变: ${integrityAfter}`);
	console.log(`  差异字节: ${differing}`);
	console.log("");
	console.log("下一步：完全退出 DSH（⌘Q），再重新打开 —— 单实例锁要求必须整个退出。");
	console.log("回滚：node patch-asar.mjs --restore");
}

main();
