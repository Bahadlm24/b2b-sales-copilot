<script setup>
import { computed, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import LanguageToggle from "../components/LanguageToggle.vue";
import { useNotifications } from "../composables/useNotifications";
import { t } from "../i18n/localeStore.js";
import { salesStore } from "../stores/salesStore";
import { themeStore } from "../stores/themeStore";

const route = useRoute();
const router = useRouter();
const { notificationsOpen, notifications, openNotification } = useNotifications();
const pageTitle = computed(() => {
  const eyebrow = t(`titles.${route.name}.0`);
  const heading = t(`titles.${route.name}.1`);
  return [
    eyebrow === `titles.${route.name}.0` ? salesStore.state.organization.productName.toLocaleUpperCase("tr-TR") : eyebrow,
    heading === `titles.${route.name}.1` ? t("titles.page") : heading,
  ];
});
const activeUser = computed(() => salesStore.currentUser.value || {
  name: t("nav.user"),
  role: "representative",
});
const activeUserInitials = computed(() => activeUser.value.name
  .split(" ")
  .filter(Boolean)
  .map((part) => part[0])
  .slice(0, 2)
  .join(""));
let tokenTimer;
onMounted(() => {
  tokenTimer = window.setInterval(() => {
    salesStore.ensureToken();
    salesStore.syncExternalLeads();
  }, 60_000);
});
onUnmounted(() => window.clearInterval(tokenTimer));
function logout() {
  salesStore.logout();
  router.push("/login");
}
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <RouterLink class="brand" to="/">
        <span class="brand-mark">{{ salesStore.state.organization.brandMark }}</span><span>{{ salesStore.state.organization.productName }}</span>
      </RouterLink>
      <nav class="nav" :aria-label="t('nav.mainMenu')">
        <RouterLink class="nav-item" to="/"><span>⌂</span> {{ t("nav.overview") }}</RouterLink>
        <RouterLink v-if="salesStore.can('leads')" class="nav-item" to="/leads"><span>＋</span> {{ t("nav.leads") }}</RouterLink>
        <RouterLink v-if="salesStore.can('meeting')" class="nav-item" to="/meeting"><span>◫</span> {{ t("nav.meeting") }}</RouterLink>
        <RouterLink v-if="salesStore.can('meetings')" class="nav-item" to="/meetings"><span>≡</span> {{ t("nav.history") }}</RouterLink>
        <RouterLink v-if="salesStore.can('meetings')" class="nav-item" to="/meeting-tracker"><span>▦</span> {{ t("nav.tracker") }}</RouterLink>
        <RouterLink v-if="salesStore.can('tasks')" class="nav-item" to="/tasks"><span>✓</span> {{ t("nav.tasks") }}</RouterLink>
        <RouterLink v-if="salesStore.can('customers')" class="nav-item" to="/customers"><span>◎</span> {{ t("nav.customers") }}</RouterLink>
        <RouterLink v-if="salesStore.can('offers')" class="nav-item" to="/offers"><span>◇</span> {{ t("nav.offers") }}</RouterLink>
        <RouterLink v-if="salesStore.can('analytics')" class="nav-item" to="/analytics"><span>↗</span> {{ t("nav.analytics") }}</RouterLink>
        <RouterLink v-if="salesStore.can('analytics')" class="nav-item" to="/reports"><span>▥</span> {{ t("nav.reports") }}</RouterLink>
        <RouterLink v-if="activeUser.role === 'admin' && salesStore.can('users')" class="nav-item" to="/users"><span>⚙</span> {{ t("nav.users") }}</RouterLink>
        <RouterLink v-if="activeUser.role === 'admin' && salesStore.can('settings')" class="nav-item" to="/settings"><span>⋯</span> {{ t("nav.settings") }}</RouterLink>
        <RouterLink v-if="salesStore.can('audit')" class="nav-item" to="/audit"><span>◷</span> {{ t("nav.audit") }}</RouterLink>
      </nav>
      <div class="sidebar-bottom">
        <small class="organization-label">{{ salesStore.state.organization.name }}</small>
        <div class="profile">
          <span class="avatar">{{ activeUserInitials }}</span>
          <span><strong>{{ activeUser.name }}</strong><small>{{ salesStore.roleLabel(activeUser.role) }}</small></span>
        </div>
        <button class="logout-button" @click="logout">{{ t("nav.logout") }}</button>
      </div>
    </aside>

    <main class="main">
      <header class="topbar">
        <div>
          <p class="eyebrow">{{ pageTitle[0] }}</p>
          <h1>{{ pageTitle[1] }}</h1>
        </div>
        <div class="top-actions">
          <LanguageToggle />
          <button
            class="theme-toggle"
            :aria-label="themeStore.isDark.value ? t('common.switchToLight') : t('common.switchToDark')"
            :title="themeStore.isDark.value ? t('common.lightTheme') : t('common.darkTheme')"
            @click="themeStore.toggle"
          >
            <span aria-hidden="true">{{ themeStore.isDark.value ? "☀" : "◐" }}</span>
            {{ themeStore.isDark.value ? t("common.light") : t("common.dark") }}
          </button>
          <div class="notification-center">
            <button class="icon-button notification-button" :aria-label="t('common.notifications')" @click="notificationsOpen = !notificationsOpen">●<b v-if="notifications.length">{{ notifications.length }}</b></button>
            <div v-if="notificationsOpen" class="notification-popover">
              <div class="panel-header"><strong>{{ t("common.notifications") }}</strong><span>{{ notifications.length }}</span></div>
              <RouterLink v-for="item in notifications" :key="item.id" :to="item.to" @click="openNotification(item)"><small>{{ item.type }}</small><span>{{ item.text }}</span></RouterLink>
              <p v-if="!notifications.length">{{ t("common.noNotifications") }}</p>
            </div>
          </div>
        </div>
      </header>
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <div :key="route.path" class="page-view">
            <component :is="Component" />
          </div>
        </Transition>
      </RouterView>
    </main>
  </div>
</template>
