/**
 * dsh-deepseek-web — host half (stub).
 *
 * 本插件只有浏览器端逻辑（lib/client.js，经 window.__ModuleLoader__ 注入）。
 * cordis loader 会 import 服务端入口，故提供一个最小的 host 侧 stub，
 * 结构对齐 dsh-client-ui-archived-sessions / dsh-client-ui-route-badge：
 * name + 空 apply。
 */
export const name = "deepseek-web";

export const apply = () => {};
