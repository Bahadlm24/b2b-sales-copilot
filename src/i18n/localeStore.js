import { computed, ref } from "vue";
import { getAppConfig } from "../config/appConfig.js";
import { messages } from "./messages.js";

const STORAGE_KEY = "sales-copilot-locale";

function getPath(source, path) {
  return path.split(".").reduce((current, key) => current?.[key], source);
}

export function detectLocale() {
  if (typeof window !== "undefined") {
    const saved = window.localStorage?.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "tr") return saved;
  }
  const configured = getAppConfig().locale;
  if (configured === "en" || configured === "tr") return configured;
  if (typeof navigator !== "undefined") {
    const language = String(navigator.language || "").toLowerCase();
    if (language.startsWith("en")) return "en";
  }
  return "tr";
}

export const locale = ref(detectLocale());
export const dateLocale = computed(() => (locale.value === "en" ? "en-US" : "tr-TR"));

export function t(path, vars = {}) {
  const active = messages[locale.value] || messages.tr;
  const value = getPath(active, path) ?? getPath(messages.tr, path) ?? path;
  if (typeof value !== "string") return path;
  return value.replace(/\{(\w+)\}/g, (_, key) => (vars[key] == null ? "" : String(vars[key])));
}

export function formatStatus(value) {
  if (value == null || value === "") return value;
  const translated = t(`status.${value}`);
  return translated === `status.${value}` ? value : translated;
}

export function formatDate(value, options) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(dateLocale.value, options || { dateStyle: "short", timeStyle: "short" });
}

export function formatMoney(amount, options = {}) {
  return new Intl.NumberFormat(dateLocale.value, {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
    ...options,
  }).format(Number(amount) || 0);
}

export function setLocale(next) {
  if (next !== "en" && next !== "tr") return;
  locale.value = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
  }
}

export function toggleLocale() {
  setLocale(locale.value === "tr" ? "en" : "tr");
}

export function applyDocumentLocale() {
  if (typeof document === "undefined") return;
  document.documentElement.lang = locale.value;
}
