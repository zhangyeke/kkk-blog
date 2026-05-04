import { registerOTel } from "@vercel/otel";

/**
 * Node 自带的 fetch（undici）默认不读 HTTP(S)_PROXY，Auth.js/Google OAuth 服务端请求会超时失败。
 * 开发机用 dev:proxy 时在此挂上 EnvHttpProxyAgent，使 undici 与 env 对齐。
 * 代理仅在 NODE_ENV === "development" 时启用，避免生产误继承 HTTP(S)_PROXY。
 */
export async function register() {
  registerOTel("next-app");

  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }
  if (process.env.NODE_ENV !== "development") {
    return;
  }
  if (!process.env.HTTP_PROXY && !process.env.HTTPS_PROXY) {
    return;
  }
  try {
    const { setGlobalDispatcher, EnvHttpProxyAgent } = await import("undici");
    setGlobalDispatcher(new EnvHttpProxyAgent());
  } catch {
    /* 非 Node 或未解析到 undici 时忽略 */
  }
}