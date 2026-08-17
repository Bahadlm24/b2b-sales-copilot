function envValue(key, fallback = "") {
  const env = typeof import.meta !== "undefined" ? import.meta.env : undefined;
  const value = env?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function runtimeValue() {
  if (typeof window === "undefined") return {};
  return window.__SALES_COPILOT_CONFIG__ || {};
}

function trimSlash(value) {
  return String(value || "").replace(/\/$/, "");
}

export function getAppConfig() {
  const runtime = runtimeValue();
  return {
    mode: runtime.mode || envValue("VITE_APP_MODE", "local"),
    apiBaseUrl: trimSlash(runtime.apiBaseUrl ?? envValue("VITE_API_BASE_URL")),
    appPublicUrl: trimSlash(runtime.appPublicUrl ?? envValue("VITE_APP_PUBLIC_URL")),
    persistMode: runtime.persistMode || envValue("VITE_PERSIST_MODE", "local"),
    locale: runtime.locale || envValue("VITE_APP_LOCALE", ""),
  };
}

export function resolveApiBaseUrl() {
  return getAppConfig().apiBaseUrl || "http://localhost:3000/api";
}

export function isLocalMode() {
  return getAppConfig().mode === "local";
}
