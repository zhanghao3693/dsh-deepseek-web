window.__ModuleLoader__.load({
	id: "@dpharness/dsh-deepseek-web",
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
		/* 各家品牌图标：从各站公开 favicon 抓取后内联为 data URI（离线可用、不热链、不额外请求）。
		 * 没有条目的站点自动退回下面的通用图标。图标版权归各家所有，此处仅用于标识对应服务。 */
		const ICONS = {
			deepseek: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAuMDAwMDAwIiBoZWlnaHQ9IjUwLjAwMDAwMCIgdmlld0JveD0iMCAwIDUwIDUwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj48cGF0aCBpZD0icGF0aCIgZD0iTTQ4LjgzNTQgMTAuMDQ3OUM0OC4zMjMyIDkuNzkxOTkgNDguMTAyNSAxMC4yNzk4IDQ3LjgwMzIgMTAuNTI3OEM0Ny43MDA3IDEwLjYwNzkgNDcuNjE0MyAxMC43MTE5IDQ3LjUyNzMgMTAuODA3NkM0Ni43NzkzIDExLjYyNCA0NS45MDQ4IDEyLjE1OTcgNDQuNzYyMiAxMi4wOTU3QzQzLjA5MjMgMTIgNDEuNjY2IDEyLjUzNTYgNDAuNDA1OCAxMy44Mzk4QzQwLjEzNzcgMTIuMjMxOSAzOS4yNDc2IDExLjI3MiAzNy44OTI2IDEwLjY1NThDMzcuMTgzNiAxMC4zMzU5IDM2LjQ2NjggMTAuMDE1NiAzNS45NzAyIDkuMzE5ODJDMzUuNjIzNSA4LjgyMzczIDM1LjUyOTMgOC4yNzE5NyAzNS4zNTYgNy43Mjc1NEMzNS4yNDU2IDcuMzk5OSAzNS4xMzUzIDcuMDYzOTYgMzQuNzY1MSA3LjAwNzgxQzM0LjM2MzMgNi45NDM4NSAzNC4yMDU2IDcuMjg3NiAzNC4wNDc5IDcuNTc1NjhDMzMuNDE4IDguNzUxOTUgMzMuMTczMyAxMC4wNDc5IDMzLjE5NzMgMTEuMzU5OUMzMy4yNTI0IDE0LjMxMiAzNC40NzM2IDE2LjY2NDEgMzYuODk5OSAxOC4zMzU5QzM3LjE3NTggMTguNTI3OCAzNy4yNDY2IDE4LjcxOTcgMzcuMTU5NyAxOUMzNi45OTQ2IDE5LjU3NTcgMzYuNzk3NCAyMC4xMzU3IDM2LjYyNCAyMC43MTE5QzM2LjUxMzcgMjEuMDgwMSAzNi4zNDg2IDIxLjE1OTcgMzUuOTYyNCAyMUMzNC42MzA5IDIwLjQzMjEgMzMuNDgxIDE5LjU5MTggMzIuNDY0NCAxOC41NzU3QzMwLjczOTMgMTYuODcyMSAyOS4xNzkyIDE0Ljk5MTcgMjcuMjMzNCAxMy41MkMyNi43NzY0IDEzLjE3NTggMjYuMzE5MyAxMi44NTYgMjUuODQ2NyAxMi41NTE4QzIzLjg2MTggMTAuNTg0IDI2LjEwNjkgOC45Njc3NyAyNi42MjcgOC43NzU4OEMyNy4xNzA0IDguNTc1NjggMjYuODE1OSA3Ljg4NzcgMjUuMDU5MSA3Ljg5NkMyMy4zMDIyIDcuOTAzODEgMjEuNjk1MyA4LjUwMzkxIDE5LjY0NyA5LjMwMzcxQzE5LjM0NzcgOS40MjM4MyAxOS4wMzIyIDkuNTExNzIgMTguNzA5NSA5LjU4Mzk4QzE2Ljg1MDEgOS4yMjM2MyAxNC45MTk5IDkuMTQzNTUgMTIuOTAzMyA5LjM3NTk4QzkuMTA1OTYgOS44MDc2MiA2LjA3Mjc1IDExLjYzOTYgMy44NDMyNiAxNC43NjgxQzEuMTY0NTUgMTguNTI3OCAwLjUzNDE4IDIyLjc5OTggMS4zMDY2NCAyNy4yNTU5QzIuMTE3NjggMzEuOTUyMSA0LjQ2NTgyIDM1LjgzOTggOC4wNzM3MyAzOC44Nzk5QzExLjgxNTkgNDIuMDMyMiAxNi4xMjU1IDQzLjU3NjIgMjEuMDQxIDQzLjI4MDNDMjQuMDI2OSA0My4xMDQgMjcuMzUxNiA0Mi42OTYzIDMxLjEwMTYgMzkuNDU2MUMzMi4wNDY5IDM5LjkzNiAzMy4wMzk2IDQwLjEyNzkgMzQuNjg2IDQwLjI3MkMzNS45NTQ2IDQwLjM5MjEgMzcuMTc1OCA0MC4yMDggMzguMTIxMSA0MC4wMDc4QzM5LjYwMjEgMzkuNjg4IDM5LjQ5OTUgMzguMjg4MSAzOC45NjM5IDM4LjAzMjJDMzQuNjIzIDM1Ljk2NzggMzUuNTc2MiAzNi44MDgxIDM0LjcxIDM2LjEyNzlDMzYuOTE1NSAzMy40NjM5IDQwLjI0MDIgMzAuNjk1OCA0MS41NCAyMS43MjhDNDEuNjQyNiAyMS4wMTYxIDQxLjU1NTcgMjAuNTY3OSA0MS41NCAxOS45OTE3QzQxLjUzMjIgMTkuNjM5NiA0MS42MTA4IDE5LjUwMzkgNDIuMDA0OSAxOS40NjM5QzQzLjA5MjMgMTkuMzM1OSA0NC4xNDc5IDE5LjAzMTcgNDUuMTE2NyAxOC40ODc4QzQ3LjkyOTIgMTYuOTE5OSA0OS4wNjQgMTQuMzQzOCA0OS4zMzE1IDExLjI1NTlDNDkuMzcxMSAxMC43ODM3IDQ5LjMyMzcgMTAuMjk1OSA0OC44MzU0IDEwLjA0NzlaTTI0LjMyNjIgMzcuODM5OEMyMC4xMTk2IDM0LjQ2MzkgMTguMDc5MSAzMy4zNTIxIDE3LjIzNTggMzMuMzk5OUMxNi40NDgyIDMzLjQ0ODIgMTYuNTg5OCAzNC4zNjgyIDE2Ljc2MzIgMzQuOTY3OEMxNi45NDQzIDM1LjU2MDEgMTcuMTgxMiAzNS45NjgzIDE3LjUxMTcgMzYuNDg3OEMxNy43NDAyIDM2LjgzMiAxNy44OTc5IDM3LjM0NDIgMTcuMjgzMiAzNy43MjhDMTUuOTI4MiAzOC41ODQgMTMuNTcyOCAzNy40Mzk5IDEzLjQ2MjQgMzcuMzgzOEMxMC43MjA3IDM1LjczNTggOC40MjgyMiAzMy41NjAxIDYuODEzNDggMzAuNTg0QzUuMjUzNDIgMjcuNzE5NyA0LjM0NzY2IDI0LjY0NzkgNC4xOTc3NSAyMS4zNjc3QzQuMTU4MiAyMC41NzU3IDQuMzg2NzIgMjAuMjk1OSA1LjE1ODY5IDIwLjE1MTlDNi4xNzUyOSAxOS45NiA3LjIyMzE0IDE5LjkxOTkgOC4yMzkyNiAyMC4wNzE4QzEyLjUzMjcgMjAuNzExOSAxNi4xODg1IDIyLjY3MTkgMTkuMjUyOSAyNS43NzU5QzIxLjAwMiAyNy41NDM5IDIyLjMyNTIgMjkuNjU1OCAyMy42ODg1IDMxLjcyMDJDMjUuMTM3NyAzMy45MTIxIDI2LjY5NzggMzYgMjguNjgzMSAzNy43MTE5QzI5LjM4NDMgMzguMzEyIDI5Ljk0MzQgMzguNzY4MSAzMC40NzkgMzkuMTA0QzI4Ljg2NDMgMzkuMjg4MSAyNi4xNjk5IDM5LjMyODEgMjQuMzI2MiAzNy44Mzk4Wk0yNi4zNDMzIDI0LjYwMDFDMjYuMzQzMyAyNC4yNDggMjYuNjE5MSAyMy45Njc4IDI2Ljk2NTggMjMuOTY3OEMyNy4wNDQ0IDIzLjk2NzggMjcuMTE1MiAyMy45ODM5IDI3LjE3ODIgMjQuMDA3OEMyNy4yNjUxIDI0LjA0IDI3LjM0MzggMjQuMDg3OSAyNy40MDY3IDI0LjE2MDJDMjcuNTE3MSAyNC4yNzIgMjcuNTgwMSAyNC40MzIxIDI3LjU4MDEgMjQuNjAwMUMyNy41ODAxIDI0Ljk1MjEgMjcuMzA0MiAyNS4yMzE5IDI2Ljk1NzUgMjUuMjMxOUMyNi42MTA4IDI1LjIzMTkgMjYuMzQzMyAyNC45NTIxIDI2LjM0MzMgMjQuNjAwMVpNMzIuNjA2NCAyNy44Nzk5QzMyLjIwNDYgMjguMDQ3OSAzMS44MDI3IDI4LjE5MTkgMzEuNDE2NSAyOC4yMDhDMzAuODE3OSAyOC4yMzk3IDMwLjE2NDEgMjcuOTkyMiAyOS44MDk2IDI3LjY4OEMyOS4yNTgzIDI3LjIxNTggMjguODY0MyAyNi45NTIxIDI4LjY5ODcgMjYuMTI3OUMyOC42Mjc5IDI1Ljc3NTkgMjguNjY3NSAyNS4yMzE5IDI4LjczMDUgMjQuOTE5OUMyOC44NzIxIDI0LjI0OCAyOC43MTQ0IDIzLjgxNTkgMjguMjQ5NSAyMy40MjM4QzI3Ljg3MTYgMjMuMTA0IDI3LjM5MTEgMjMuMDE2MSAyNi44NjMzIDIzLjAxNjFDMjYuNjY2IDIzLjAxNjEgMjYuNDg0OSAyMi45Mjc3IDI2LjM1MTEgMjIuODU2QzI2LjEzMDQgMjIuNzQ0MSAyNS45NDkyIDIyLjQ2MzkgMjYuMTIyNiAyMi4xMjAxQzI2LjE3NzcgMjIuMDA3OCAyNi40NDU4IDIxLjczNTggMjYuNTA4OCAyMS42ODhDMjcuMjI1NiAyMS4yNzIgMjguMDUyNyAyMS40MDc3IDI4LjgxNjkgMjEuNzE5N0MyOS41MjU5IDIyLjAxNjEgMzAuMDYxNSAyMi41NjAxIDMwLjgzNCAyMy4zMjgxQzMxLjYyMTYgMjQuMjU1OSAzMS43NjMyIDI0LjUxMTcgMzIuMjEyNCAyNS4yMDhDMzIuNTY2OSAyNS43NTIgMzIuODkwMSAyNi4zMTIgMzMuMTEwNCAyNi45NTIxQzMzLjI0NDYgMjcuMzUyMSAzMy4wNzEzIDI3LjY4MDIgMzIuNjA2NCAyNy44Nzk5WiIgZmlsbD0iIzRENkJGRSIgZmlsbC1vcGFjaXR5PSIxLjAwMDAwMCIgZmlsbC1ydWxlPSJub256ZXJvIiAvPjwvc3ZnPg==",
			kimi: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAABIFBMVEUAAAD8/PwAAABHR0fo6OgkJCQWFha4uLgAAAAAAAAAAAAXgv2WlpYAAADHx8eMjIwWffQEFy1aWlo4ODipqanb29t1dXUPVacTbdRkZGQRYLsHKlIOUZ0LPHYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAvH7UVAAAAYHRSTlP+/wL//////9KORf//NP////////////////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAArPJ3uAAABM0lEQVR42pWW6ZKDIBCEh3DjHaIm2d33f81VjqipRGb6j0XZH/ZAyQCXJGcNfJWxLvsgPiwUZXdAYwAh02TAAVIuAg2g1QTA4AGzAhYIsgsAJF0AVfF8fw6pbsAkevZVdY+EBUTJw+Kv+p9YNibQHgAs0M8fXkit9U29hmrSqx4w/M7z36eZOGNMbMDEVrXq+6cDIPOoC34tAQeo6G/P/AegK+Y5AinPuX8DFCL/HlA1av4NiP5b0Z8B7PwJ8DVmfTaAtcHPOGCBJDEpGrAULYkAGzkSGPkkYqxOYQDhAXwqvbDXARiDJ202E48ikINfYyzW1hL5A3mdir8igVcsNJBjFYDDSsp6PAPejpmYi3f+7cinnd4GLA2w4GiAozcUessiN0V62yU3dvrVgX45oVx//gHvsQstv9FNagAAAABJRU5ErkJggg==",
			doubao: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAABIFBMVEUhHh3lpZZmWFchISC6urqlsOXG4PQgICF4e4W6z+PMfWpkOzTZ0tOtxdzhiXkA///LvsN2go7/AP+wtrqob2O70eV////VwLrH4/9VVVVueYQ/Pz/K5f4AAABJNjEwJiX4183nua3uxbnW8v/0zcIaGRjG2/FTSUj///9CLSjOmIoqGBXVppdUQT364tiqusu/v/9uWVR2c3bXtK1qZmg1IR3LiHeTdm7D3PW3x9ZXVVe1zOizmpY2NDS81O2RnKmq//+HhojJx9GGYVhtRDsRCAf56ea60uumt8l/f/+whXuMWU6kpanQqqONamKvjIQbGxuueGy81O2raFuUlZmzzOOYtsSTp7uXo7PA2PS80eavwditwtzB2u+nv9cjIyMfhoqcAAAAYHRSTlPy//9dAxerif//////Fv8B//8B//9PAv8lA70E/QD//f////7//ff/Af////////4E/////////7b//2H//ov+A////////2sWAv///////xf/zP//UBEZ/8D+IUZlRLJfXVKhAAAEM0lEQVR42nWW52LiOhCFRbLp2/f2a1m2AHeKbbCBUJaWEAgQSE82m/d/izsqNiV754fj2OfTnJHEyAivhVWGy+j3dm1pKIqx3G/f3sODsrWuQet6UL/sK4qSzWbhorCovYz4i18AFxa+bytMqjyVOp1OyVA4q+yPsHXxFviO8YsYtVRRCalWidnhOeDhC3+9CZTxXo3LnyoEQmUXN3g4rLOH2dpeagsl+h9yeFOVYXPOvBRJfuDyOlDGpyJ9aScFJEF26vzNqSQ48C7RH3VXepXZAqyqliTxLgG+459Cb1z6NpcWCoUEYITI8ZNXjth8PivSUCDkJuSxbamH4ivi9TObXcQSPIpFMm64oQLUYbOJrRLV5ESLm8o+4j0GWPg8u5HALHAzk7EXxrbIIVYkew5iZFkflKSChvAPervvacWzs2JTJayWGym5syxUxm2ZoN4VFYBgMKZasVjUtCL1CZQti4AUZYTvkgTfKlJvDyKqMQAITfOrNmnVpWb0FeFTmUCWzMZfhLlUr+X8qkqSbXX+CeGaBHpBQQAnCy+nsQxCn9NhjEACNYzuDWnpmy/0rj3oLzxtLRxCKonvEbqVt8qlcFStDvqzyWAstF6/P5vTvttIVLeonbBiGxF7EulgIxR+4tk47sdzkgJtlJRgBAI4mfizsS7Gz1EK1VDPKSRAtoaW8rZXKYgSSGuYVx2m1CilzTj2KPUDOayyREnNdb4KRB00GrB5gmmOJdD9Yd5UY32nlFgyUHJX9wXwW2C2hvbllDuaN8xhJYj1uJfIlDfAdVMduv57XgOFmRv6IQ3nekqsLHHAVq8dZ7GQc5TTfERucjScUmoklpYbNTAgQ3M5AUAOx9F1PdRTYLmaVjFL6rWnC4BSnZXN9CFMbzqt6cLJrTRhAC9A1zVBhPDISBfudhM4uY4EUGSOOBA2P/eM1dYYJdXEYqUnEfekZz5GGbAOQHyYTSfVuE+3t9EVK23PHA9S0MzH4yjD9HP3IdWz7f0paQFy81VJ3wnhB5cD88xQ7LqlFXCK0dfEUxdGVwvEdd3BeErFwunNHdetrgDjDkMTkCmeOhXoR2pQaZizyIE6qD733aG7liHbhiZgWXfpAMrRQ4nRveMoihynebjTMCFWGT5Am1lrZGl8jpwoOl70tp6LRoah/z1uvQkdz3OcKFSMDf0j68YbzTgpzfFgijxnupX4GV9stXsZU7bhdD3jNW8eSkfp47Tdrx0obNd+aWZ0tsSwBl4z77bML0/bB8rqyDI6DTI0/+S/BdiyZ808C97tN46s5FDstOA1yZNu74zF+y6B/xHJt5TtQ5Ed9nv7XVCzgD9mJQga7AYhQPL//JXoNw72XZIGt8JxYPK7WPh/8+lwdUDeRv7gClt//PLj5G+Mr3ZfN+Wvu1cY/9/XDMb/YsYcvCKmRa8H22qM8X+oNkbFjd+gKAAAAABJRU5ErkJggg==",
			yuanbao: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAABIFBMVEUAy2/8/v0AAAAE1XcCAgIu1YkAxWsA43zT9uar7c8A//8A/wAAuWVw46+38NZL25qY6sUAumUD64MAp1wAvnwASSYAzGYAxWwAKxXT09MAwmoWFhYEsmMAqFwAf38Dp1d3d3eJ57zm5+cAhUcBlVJZ3qIAVVXJyckCuGWqqKkAt2UAdj4A1H8Cdz4lJSUA/6oAqVsAmVQAlFIAfwAAekMA/38ArmBHR0dj3qeIg4XB89xuaWs3Nze5ubkAvz8AlFMApFoc04AAWzYGPiUAmWYANhsA0XIAik1SUlKc8swAh0oAc0EAGg0t5JJVqlX///9dYV9E4psfIiEAQh6x38rq2eA4xIQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACG40TXAAAAYHRSTlP9/gD9//7M/v/+AQHX/////uX+pgUtBrYi/4X/rpECBf///1xU/wP/l/9dWwYO/wN3cI8CZAK2//7//////wQbUv4cKAUcph3/+2BdE/8DAf/9/yr//9QAAAAAAAAAAACS9qc1AAADDUlEQVR42o2WCXuiMBCGhwy3CCgg1nrf1R5evdvt3e597/7/n7IDiICi7DyPGJN5zSRMvgmwuL07oUd5bGlAVp0tHPqp2rm4C0TN+iE9uq4oirA0ag471FmqpwEl+lReNZQkRPTc6UuSoOBWysFgEph/Y2xUgyLCmmERrXsKrJ8EKMy3IWx4L5nC5M53ic/w9alahK0mnTnP8RkIHv/9gdsBmmTKcrkQaJyqUy2fh10Aah31tLEEjtgv7Yt5ARnEE7MD4IQdVfGDIkAGUX1kqgfUWWMiPXBXCBkm1UqsT0CJdQvQ43QBMm3EDhnMc2ULQf8fAGtMzYHNKggCx8m9bAArqg31F7EIBsdxrU0PodcyFcXMh5MXXaYC6xQQ8gTI6zFhXpE53/RWMIZilxY9pJbpdStrf29ykelGQLgEUESo+L2Jdy1ccXEL5pdEBo4ohQBnClE4Mpc0PQDKsBBxBXCyQgtEwWitu5MZ/iI+wQxigMfIyu8U92CJCBaceUB8fX8urw/aQfO2eRAbQA/QgpDzUXf7O8//DPwGN/z+XjQS33Yj6t475nm+6TebPH+8BcAYsB8Cl9QYxEJKvCUlCVx7rfc8fxN/E0tXzdcKIQXwIhqs79IZ7RMmpohCGpzz/Hl7BfR8YAZj0QeMcO/bFMl+sEu3x7Fd0oPsW0CZUiOxs4Pz/Wb4Hm4uwxlkI0gNh5IvAMDkdlmgKV7yMXd5+gV9u/vqOA4J6IqYcgCSmWqE+tdhoDI3FFVspWadvMr6ovhSB1ut4EqSjJSwri5iIsBsyKmsFtOw9YNjGtEgWuXcHEibRsmzTGffp2S9ZSSEodAl1QNSP7smJeVCCOwhqZ7SpEG6SmKssscqYraKVY9It325t5mjZREk9w7VhbCgsE4GQf7TqKB4xWha2A1onWVZDIvis2NJO0qD5TQ2yu7dZNskCLW3jbLbp2p0b2FaYYfa6DNT52lXh3LFLUDy6oDaa4WlXR28y4nX+3GYvJy4Xeo87KfeZihMmwJjzmJW9eXBGtO1hJ28S9yQ/gG6hDlbHF6GJgAAAABJRU5ErkJggg==",
			qwen: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAABIFBMVEUHLf4AAAAAAP8IMP4HK/QAVf8GKeoAAH4FJM0GJdYGJdcHI7gAPP8GJ+IEJcwAf/8GKOUFJMwCFGwGHa8GIbUAGZAGKOYAVaoBK+oAG6UAADEAALEAObgAD48HHpwAHtEAF28HH88AE04GKeMAM2YAD08AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA16UNGAAAAYHRSTlP9AAH+1gOvAk6MbRsEbRUCizYQKCwNUAMUFAYDBxAhESAgDSUFEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB5C8dfAAACMElEQVR42o1V6bqqMAxM0pYisigIHvVsd3v/V7yhRUwX9Mwv5eukWSZTwAiE2OwYjSXCDCD+cKsL5VCg/QmhxkaBR4n0mkDU6+U86A9D9o41v4hg8HA/D6qKi0sJRJ8g0Lb7BW17Z4QEYwsFeegJu4RAeIQtKBhcHZJAHWrYZhQYE8yjpVm4PoOvlcH/Wv3svCqufAoeDSP8gue4oCNw5DcG/3h/ecOcEmHl/hdvNZZPLzjimQk1Tr5SpZGuWr3skhBPiTg8mUNL1rX1sAbVI2GptzD45sDlUahqeBTbWLQU1LmnmjYO8qZgfMNcV5ec58T77+/+sUCVCjpHSfyjC6lLv7JAf+W0dEyw3R6WiCffVhNOK15ks3ZxVatBuTT60lFQwCCDGS+NvbxiJ68g8yWi8Zyc+N7F7OZUhYFRkC+7wm0mWKEOl+pjevQ71O8vIkjiiLrraAXVAY3bONMLlaq1tUSXVOGOcAuvaBYZEMamw/mCb94u+D66us+UEfspU4NL1V+Q2bp5pymxo3kZc6bjUzLLUsvvprPUZvZucJMeU7M4cd1VuqaurYQfOUIoGPCP0pUsSEEKoycrK9blVFXV1N+NbEhdNB5+8GRRuHXzrDs5M/5vZtR396ZzL0eq4NSFFZdCj969cax2Kyp2oHFLv+k77VVayhw/ySYEChAMObI3yHvcH9niYMuzBPlcq8hHYMNH/60trQ3+gGBw4vayGvwr8prAaUxzp5vEO/8D8PEUD5Cu1JUAAAAASUVORK5CYII=",
			chatglm: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAABIFBMVEX9/v4SQ/MHOfI4Y/4tWvwAAABUePvL1v2RqPxDavrc4/5qifvm6/6nufy2xf13k/ubsf3Y2NiCnPz////Dw8Pi4uLU1NR/f3+/v7/x8fEhT/Vfgf/Nzc3Bzv2Xl5fS0tLPz8+3t7e/v78AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABqf3EAAAAYHRSTlP+/////wD//////////////yz/AjSOqgIE3v//Xv8bYWAgQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADIBW+iAAACiUlEQVR42pVW53rqMAz13iMEWkopHff9H/Jacoaz+lHxg0Q+Gpal4xAp5VXK08cr+VVeP04IlETKN/n5Qp6Ql4s8g8GbvNzIcwIW5Cov5GkpFuR82lvR0WTvfR8fC/Xt50zkNn+draCsCuXZtfuQZBMgWgDTQeAxN6sn8rWGj2A2mjHG9bT+TRb1d6qC5hD4wN4ni+VxxfcBLpRJARxEhSomdovmqztmu9BUwKPS7+BVhfO00htQU32ApwaeA8ocuSzkfbx1RHe9V8paq1Q2ER0LVnYR1vkDXkWjuADhfPhXvSYZQixz6motAM2XUow8Giy25iioKBcTSIxx8BW8xfUGGBV1lVvfm678src1IhqYBp/wUHGJe9Mmq2FPXLBVBKyQAHj/2JQ7+ZpS40djgIK/690O0BCBNl2ORSiBzdGgwTlYErvmvWQkuiO8qSedeRhrCg187D+gw0Ts6BJrJO7k1wCWJC7UrAAPB+JwRFJQpYx6NuDuKCELARTRcKrVa181B1KbwJXpLXXs5hyPDGoXR9IaJGzUsJuPmuYTUxrag266dzxiW6cKCQJaTTdp7uTU0YrH4FCkEZPYun0H97N/YqA3zaJbad9sI0RV3Q/80uGsTKV3ok5on0DldOfFwICVRNA/b5vtMbijOJgjUzKmcJfOI95vW54OJD9yMLp0BkddqED2LCaapwqK7lJv66jf1wflPG15W5iYCgsoMTDDTHwzfxtLcXop8oudCK08qDjDv5sgQ/g1k6nmiL6WV1a5DyqNTXzGuU9hcWWtL0UX871wccEXNvY5LfdaLsXzz/ZaD06D7MzUqdzTf7vYr0Q+b3H7V74zysdJsXju4+Sz4MHgb58//wERaBlPd0czLAAAAABJRU5ErkJggg=="
		};

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
		/*
		 * 品牌图标：ICONS 里有该站条目就渲染内联图（data URI，离线可用、不热链、不发额外请求），
		 * 否则退回上面的通用地球图标——所以 SITES 里新加的站点不配图标也不会缺图。
		 */
		function siteIcon(site, size) {
			const uri = ICONS[site.id];
			if (typeof uri !== "string" || uri.length === 0) return globeIcon(size);
			return (0, react_jsx_runtime.jsx)("img", {
				className: "dswb_icon",
				src: uri,
				width: size,
				height: size,
				alt: "",
				"aria-hidden": "true",
				draggable: false
			}, "icon-" + site.id);
		}

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
.dswb_icon{flex:none;display:block;border-radius:4px;object-fit:contain}
.dswb_itemLabel{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left}
.dswb_collapsed .dswb_menu{align-items:center;padding:3px 0}
.dswb_collapsed .dswb_item{justify-content:center;width:32px;height:32px;padding:0;border-radius:50%}
.dswb_collapsed .dswb_button{justify-content:center;width:36px;height:36px;margin:2px 0;border-radius:50%;padding:0;gap:0}
		`;
		const tagId = "@dpharness/dsh-deepseek-web/DeepSeekWeb.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			/* data-plugin 必须等于 __ModuleLoader__.load 的 id：HMR 的
			 * removeOwnedStyles(id) 按这个属性回收样式，不一致会留下僵尸 <style>。 */
			tag.dataset.plugin = "@dpharness/dsh-deepseek-web";
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
								siteIcon(site, 18),
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
		exports.ICONS = ICONS;
		exports.openWebChat = openWebChat;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	},
});
