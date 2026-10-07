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

		/*
		 * 0.1.7 把产品图标从 `<Glyph><size>`（IconNewChatOutline20）改名成
		 * `<Glyph><weight>`（IconNewChatOutlineRegular）；渲染尺寸改为只由 `size` prop 决定。
		 * 跨两套命名解析，并且在没有图标时返回 null，而不是把 undefined 交给 React ——
		 * 渲染期抛错会让 slot 的错误边界直接撤下这个入口（按钮静默消失）。
		 */
		function chatIcon(size) {
			const Icon = primitives.IconNewChatOutlineRegular
				?? primitives.IconNewChatOutlineMedium
				?? primitives.IconNewChatOutline20
				?? primitives.IconGlobeOutlineRegular
				?? primitives.IconGlobeOutlineMedium
				?? primitives.IconGlobeOutline14
				?? null;
			return Icon === null ? null : (0, react_jsx_runtime.jsx)(Icon, { size });
		}

		/* ------------------------------------------------------------------ styles */
		const css = `
/* 底部 action 区竖排：与原生「上下文洞察」一致的全宽堆叠（data-slot 出口是 display:contents，flex 项是各插件根节点） */
div:has(> [data-slot="sidebar.footer.action"]){flex-direction:column;align-items:stretch}
.dswb_root{display:flex;width:100%;align-self:stretch;min-width:0}
.dswb_collapsed{justify-content:center}
.dswb_button{box-sizing:border-box;display:flex;align-items:center;justify-content:flex-start;gap:8px;width:100%;height:40px;margin:2px 0;color:var(--dsw-alias-label-primary);background:transparent;border:none;border-radius:12px;padding:0 10px 0 8px;font:inherit;font-size:14px;line-height:22px;text-align:left;cursor:pointer;text-decoration:none;transition:background .12s}
.dswb_button:hover{background:var(--dsw-alias-interactive-bg-hover)}
.dswb_button:focus-visible{outline:2px solid var(--dsw-specific-accent-primary,#4f46e5);outline-offset:1px}
.dswb_buttonLabel{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left}
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
		 * chat.deepseek.com 的 `content-security-policy: frame-ancestors 'none'`
		 * 不会生效（<iframe> 才会被它拒绝）。
		 * 传参形状来自该插件自身：tab.navigation.params.url。
		 */
		const BROWSER_KIND = "browser";
		const DEEPSEEK_WEB_URL = "https://chat.deepseek.com";

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
		 * 在右侧边栏的浏览器 tab 里打开 DeepSeek 网页版。
		 * 任一步失败都退回系统浏览器（桌面端 window.open(http/https) 由主进程
		 * setWindowOpenHandler → shell.openExternal 承接），保证入口不会「点了没反应」。
		 */
		function openDeepSeekWeb(ctx) {
			const rightbar = resolveSidebarRight(ctx);
			if (rightbar !== void 0 && typeof rightbar.openTab === "function") {
				try {
					rightbar.openTab(BROWSER_KIND, { params: { url: DEEPSEEK_WEB_URL } });
					return;
				} catch (error) {
					console.warn("[deepseek-web] 侧边栏浏览器打开失败，回退系统浏览器", error);
				}
			} else {
				console.warn("[deepseek-web] 未找到 sidebarRight.openTab（右侧栏不可用？），回退系统浏览器");
			}
			try {
				window.open(DEEPSEEK_WEB_URL, "_blank", "noopener,noreferrer");
			} catch (error) {
				console.warn("[deepseek-web] window.open 也失败了", error);
			}
		}

		/* ---------------------------------------------------------------- locales */
		const NS = "deepseek-web";
		const zh = {
			"button.label": "DeepSeek 网页版",
			"button.title": "在右侧边栏打开 chat.deepseek.com（免费网页版）"
		};
		const en = {
			"button.label": "DeepSeek Web",
			"button.title": "Open chat.deepseek.com in the right sidebar (free web chat)"
		};

		/* -------------------------------------------------------------- components */
		function DeepSeekWebEntry({ t, wide, onOpen }) {
			const label = t("button.label");
			const title = t("button.title");
			return (0, react_jsx_runtime.jsx)("div", {
				className: "dswb_root" + (wide ? "" : " dswb_collapsed"),
				style: { width: "100%", alignSelf: "stretch", display: "flex", minWidth: 0 },
				children: (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "dswb_button",
					title,
					"aria-label": title,
					onClick: onOpen,
					children: [
						chatIcon(wide ? 16 : 18),
						wide && (0, react_jsx_runtime.jsx)("span", { className: "dswb_buttonLabel", children: label })
					]
				})
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
				}, (props) => (0, react_jsx_runtime.jsx)(DeepSeekWebEntry, {
					t: props.t,
					wide: props.wide,
					onOpen: () => openDeepSeekWeb(ctx)
				})));
			} catch (error) {
				console.warn("[deepseek-web] slot 注册失败", error);
			}
		}

		exports.NS = NS;
		exports.URL = DEEPSEEK_WEB_URL;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	},
});
