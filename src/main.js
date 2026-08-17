import { createApp, watchEffect } from "vue";
import App from "./App.vue";
import router from "./router";
import "./style.css";
import { applyDocumentLocale, locale } from "./i18n/localeStore";
import { salesStore } from "./stores/salesStore";
import { themeStore } from "./stores/themeStore";

watchEffect(() => {
  document.title = salesStore.state.organization.productName || "Sales Copilot";
});
watchEffect(() => {
  locale.value;
  applyDocumentLocale();
});

themeStore.initialize();
const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
salesStore.setClientContext({
  ipAddress: localHosts.has(window.location.hostname) ? "127.0.0.1" : "backend-required",
  userAgent: navigator.userAgent,
});

createApp(App).use(router).mount("#app");
