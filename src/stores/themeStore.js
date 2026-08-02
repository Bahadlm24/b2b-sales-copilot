import { computed, ref } from "vue";

const STORAGE_KEY = "sales-copilot-theme";
const savedTheme = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
const systemPrefersDark = typeof window !== "undefined"
  && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
const theme = ref(savedTheme === "dark" || savedTheme === "light"
  ? savedTheme
  : systemPrefersDark ? "dark" : "light");

function applyTheme() {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme.value;
  document.documentElement.style.colorScheme = theme.value;
}

export const themeStore = {
  theme,
  isDark: computed(() => theme.value === "dark"),
  initialize: applyTheme,
  toggle() {
    theme.value = theme.value === "dark" ? "light" : "dark";
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, theme.value);
    applyTheme();
  },
};
