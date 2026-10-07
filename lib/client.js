window.__ModuleLoader__.load({
	id: "dsh-deepseek-web",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		let primitives = {};
		try {
			primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		} catch (error) {
			console.warn("[deepseek-web] primitives 不可用，入口按钮将不带图标", error);
		}

		/* ------------------------------------------------------------------ sites */
		/*
		 * 站点列表就是整个配置面：往里追加一行即可多一个入口，`id` 只用于 React key。
		 * url 用各站首页——登录后它们自己会跳进会话页，硬编码深链反而容易失效。
		 * 顺序 = 菜单顺序；第一项是「默认站点」（非桌面端的 window.open 回退也用它）。
		 */
		const SITES = [
			{ id: "deepseek", label: "DeepSeek 网页版", url: "https://chat.deepseek.com" },
			{ id: "kimi", label: "Kimi", url: "https://www.kimi.com" },
			{ id: "doubao", label: "豆包", url: "https://www.doubao.com/chat/" },
			{ id: "yuanbao", label: "腾讯元宝", url: "https://yuanbao.tencent.com" },
			{ id: "qwen", label: "通义千问", url: "https://chat.qwen.ai" },
			{ id: "chatglm", label: "智谱清言", url: "https://chatglm.cn" }
			/*
			 * 下面三个在本机 curl 探活返回 403（Cloudflare 拦 curl，不代表浏览器里打不开），
			 * 也没在 webview 里实测过，所以默认注释掉。要用请自行在面板里验证后放开：
			 * { id: "chatgpt", label: "ChatGPT", url: "https://chatgpt.com" },
			 * { id: "claude", label: "Claude", url: "https://claude.ai" },
			 * { id: "gemini", label: "Gemini", url: "https://gemini.google.com" },
			 */
		];
		const DEFAULT_URL = SITES[0].url;

		/* ------------------------------------------------------------------ icons */
		/*
		 * 0.1.7 把产品图标从 `<Glyph><size>`（IconNewChatOutline20）改名成
		 * `<Glyph><weight>`（IconNewChatOutlineRegular）；渲染尺寸改为只由 `size` prop 决定。
		 * 跨两套命名解析，并且在没有图标时返回 null，而不是把 undefined 交给 React ——
		 * 渲染期抛错会让 slot 的错误边界直接撤下这个入口（按钮静默消失）。
		 */
		function pickIcon(names) {
			for (const name of names) {
				const Icon = primitives[name];
				if (Icon !== void 0 && Icon !== null) return Icon;
			}
			return null;
		}
		function renderIcon(names, size) {
			const Icon = pickIcon(names);
			return Icon === null ? null : (0, react_jsx_runtime.jsx)(Icon, { size });
		}
		const chatIcon = (size) => renderIcon([
			"IconNewChatOutlineRegular",
			"IconNewChatOutlineMedium",
			"IconNewChatOutline20",
			"IconGlobeOutlineRegular",
			"IconGlobeOutlineMedium",
			"IconGlobeOutline14"
		], size);
		const globeIcon = (size) => renderIcon([
			"IconGlobeOutlineRegular",
			"IconGlobeOutlineMedium",
			"IconGlobeOutline14",
			"IconGlobeOutline20",
			"IconNewChatOutlineRegular"
		], size);

		/* ------------------------------------------------------------------ styles */
		/* 每个取值都带兜底：主题变量改名时最多退化成继承色，不会整块失样式。 */
		const css = `
/* 底部 action 区竖排：与原生「上下文洞察」一致的全宽堆叠（data-slot 出口是 display:contents，flex 项是各插件根节点） */
div:has(> [data-slot="sidebar.footer.action"]){flex-direction:column;align-items:stretch}
.dswb_root{display:flex;flex-direction:column;width:100%;align-self:stretch;min-width:0}
.dswb_collapsed{align-items:center}
.dswb_button{box-sizing:border-box;display:flex;align-items:center;justify-content:flex-start;gap:8px;width:100%;height:40px;margin:2px 0;color:var(--dsw-alias-label-primary,inherit);background:transparent;border:none;border-radius:12px;padding:0 10px 0 8px;font:inherit;font-size:14px;line-height:22px;text-align:left;cursor:pointer;text-decoration:none;transition:background .12s}
.dswb_button:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12))}
.dswb_button:focus-visible{outline:2px solid var(--dsw-specific-accent-primary,#4f46e5);outline-offset:1px}
.dswb_buttonLabel{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left}
.dswb_chevron{flex:none;font-size:10px;line-height:1;opacity:.6}
.dswb_menu{display:flex;flex-direction:column;gap:1px;box-sizing:border-box;width:100%;margin:0 0 2px;padding:3px;border-radius:12px;background:var(--dsw-alias-bg-elevated,rgba(127,127,127,.08))}
.dswb_item{box-sizing:border-box;display:flex;align-items:center;justify-content:flex-start;gap:8px;width:100%;height:32px;margin:0;padding:0 8px 0 10px;color:var(--dsw-alias-label-primary,inherit);background:transparent;border:none;border-radius:9px;font:inherit;font-size:13px;line-height:20px;text-align:left;cursor:pointer;text-decoration:none}
.dswb_item:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12))}
.dswb_item:focus-visible{outline:2px solid var(--dsw-specific-accent-primary,#4f46e5);outline-offset:1px}
.dswb_itemLabel{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left}
.dswb_collapsed .dswb_menu{align-items:center;padding:3px 0}
.dswb_collapsed .dswb_item{justify-content:center;width:32px;height:32px;padding:0;border-radius:50%}
.dswb_collapsed .dswb_button{justify-content:center;width:36px;height:36px;margin:2px 0;border-radius:50%;padding:0;gap:0}
		`;
		const tagId = "dsh-deepseek-web/DeepSeekWeb.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-deepseek-web";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}

		/* ---------------------------------------------------------------- targets */
		/*
		 * 目标是 DSH 桌面版内置的「右侧边栏浏览器」页类型
		 * （@deepseek-ai/dsh-client-ui-sidebar-browser，BROWSER_KIND = "browser"）。
		 * 该页在桌面端用 Electron <webview> 承载，是独立 Chromium guest，因此
		 * 站点侧的 `content-security-policy: frame-ancestors 'none'`
		 * 不会生效（<iframe> 才会被它拒绝）。
		 * 传参形状来自该插件自身：tab.navigation.params.url。
		 */
		const BROWSER_KIND = "browser";

		/* 惰性解析 sidebarRight：不在 inject 里声明，避免服务缺失时插件永久 pending
		 * （dsh-locale-fallback 就是这样把整个 boot 拖挂的）。 */
		function resolveSidebarRight(ctx) {
			try {
				if (ctx.sidebarRight !== void 0) return ctx.sidebarRight;
			} catch (error) {
				/* 未注入该服务时读属性可能抛错，忽略 */
			}
			try {
				if (typeof ctx.get === "function") {
					const service = ctx.get("sidebarRight");
					if (service !== void 0) return service;
				}
			} catch (error) {
				/* 同上 */
			}
			return void 0;
		}

		/**
		 * 在右侧边栏的浏览器 tab 里打开任意网页版 AI。
		 * 任一步失败都退回系统浏览器（桌面端 window.open(http/https) 由主进程
		 * setWindowOpenHandler → shell.openExternal 承接），保证入口不会「点了没反应」。
		 */
		function openWebChat(ctx, url) {
			const target = typeof url === "string" && url.length > 0 ? url : DEFAULT_URL;
			const rightbar = resolveSidebarRight(ctx);
			if (rightbar !== void 0 && typeof rightbar.openTab === "function") {
				try {
					rightbar.openTab(BROWSER_KIND, { params: { url: target } });
					return;
				} catch (error) {
					console.warn("[deepseek-web] 侧边栏浏览器打开失败，回退系统浏览器", error);
				}
			} else {
				console.warn("[deepseek-web] 未找到 sidebarRight.openTab（右侧栏不可用？），回退系统浏览器");
			}
			try {
				window.open(target, "_blank", "noopener,noreferrer");
			} catch (error) {
				console.warn("[deepseek-web] window.open 也失败了", error);
			}
		}

		/* ---------------------------------------------------------------- locales */
		const NS = "deepseek-web";
		const zh = {
			"button.label": "网页版 AI",
			"button.title": "在右侧边栏打开免费网页版 AI（DeepSeek / Kimi / 豆包 …）"
		};
		const en = {
			"button.label": "Web AI",
			"button.title": "Open a free web AI chat in the right sidebar (DeepSeek / Kimi / Doubao …)"
		};

		/* -------------------------------------------------------------- components */
		function WebChatEntry({ t, wide, onSelect }) {
			const [open, setOpen] = react.useState(false);
			const rootRef = react.useRef(null);
			react.useEffect(() => {
				if (!open) return void 0;
				const onDocClick = (event) => {
					const el = rootRef.current;
					if (el !== null && el !== void 0 && !el.contains(event.target)) setOpen(false);
				};
				const onKeyDown = (event) => {
					if (event.key === "Escape") setOpen(false);
				};
				document.addEventListener("click", onDocClick, true);
				document.addEventListener("keydown", onKeyDown);
				return () => {
					document.removeEventListener("click", onDocClick, true);
					document.removeEventListener("keydown", onKeyDown);
				};
			}, [open]);

			const label = t("button.label");
			const title = t("button.title");
			return (0, react_jsx_runtime.jsxs)("div", {
				ref: rootRef,
				className: "dswb_root" + (wide ? "" : " dswb_collapsed"),
				style: { width: "100%", alignSelf: "stretch", display: "flex", flexDirection: "column", minWidth: 0 },
				children: [
					(0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "dswb_button",
						title,
						"aria-label": title,
						"aria-expanded": open ? "true" : "false",
						"aria-haspopup": "menu",
						onClick: () => setOpen((value) => !value),
						children: [
							chatIcon(wide ? 16 : 18),
							wide ? (0, react_jsx_runtime.jsx)("span", { className: "dswb_buttonLabel", children: label }) : null,
							wide ? (0, react_jsx_runtime.jsx)("span", { className: "dswb_chevron", "aria-hidden": "true", children: open ? "▾" : "▸" }) : null
						]
					}, "entry"),
					open ? (0, react_jsx_runtime.jsx)("div", {
						className: "dswb_menu",
						role: "menu",
						children: SITES.map((site) => (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							role: "menuitem",
							className: "dswb_item",
							title: site.url,
							"aria-label": site.label + " — " + site.url,
							onClick: () => {
								setOpen(false);
								onSelect(site.url);
							},
							children: [
								globeIcon(wide ? 14 : 16),
								wide ? (0, react_jsx_runtime.jsx)("span", { className: "dswb_itemLabel", children: site.label }) : null
							]
						}, site.id))
					}) : null
				]
			});
		}

		/* ---------------------------------------------------------------- plugin */
		const inject = ["slots", "locale"];
		function apply(ctx) {
			try {
				ctx.effect(() => ctx.locale.register(NS, { zh, en }), "deepseek-web: dictionaries");
			} catch (error) {
				console.warn("[deepseek-web] locale.register 失败", error);
			}
			try {
				ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({
					name: "sidebar.footer.action",
					id: "deepseek-web",
					order: 15,
					locale: NS,
					label: () => ctx.locale.bind(NS)("button.label"),
					inject: () => ({})
				}, (props) => (0, react_jsx_runtime.jsx)(WebChatEntry, {
					t: props.t,
					wide: props.wide,
					onSelect: (url) => openWebChat(ctx, url)
				})));
			} catch (error) {
				console.warn("[deepseek-web] slot 注册失败", error);
			}
		}

		exports.NS = NS;
		exports.SITES = SITES;
		exports.openWebChat = openWebChat;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	},
});
