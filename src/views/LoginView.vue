<script setup>
import { reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import LanguageToggle from "../components/LanguageToggle.vue";
import { t } from "../i18n/localeStore.js";
import { salesStore } from "../stores/salesStore";

const router = useRouter();
const route = useRoute();
const mode = ref("login");
const loginForm = reactive({ username: "admin", password: "1234" });
const reminderEmail = ref("");
const feedback = ref("");

function login() {
  const result = salesStore.login(loginForm.username, loginForm.password);
  feedback.value = result.ok ? "" : result.message;
  if (result.ok) router.push(typeof route.query.redirect === "string" ? route.query.redirect : "/");
}

function remindPassword() {
  const result = salesStore.requestPasswordReminder(reminderEmail.value);
  feedback.value = result.message;
}

function changeMode(nextMode) {
  mode.value = nextMode;
  feedback.value = "";
}
</script>

<template>
  <main class="login-page">
    <section class="login-brand">
      <span class="brand-mark large-mark">{{ salesStore.state.organization.brandMark }}</span>
      <strong class="login-product-name">{{ salesStore.state.organization.productName }}</strong>
      <p class="eyebrow light">{{ t("login.workspace") }}</p>
      <h1>{{ t("login.headline") }}</h1>
      <p>{{ t("login.intro", { org: salesStore.state.organization.name }) }}</p>
    </section>
    <section class="login-card">
      <div class="login-locale"><LanguageToggle /></div>
      <div v-if="mode === 'login'">
        <p class="eyebrow">{{ t("login.secure") }}</p>
        <h2>{{ t("login.title") }}</h2>
        <p class="login-description">{{ t("login.description") }}</p>
        <form class="task-form" @submit.prevent="login">
          <label><span>{{ t("login.username") }}</span><input v-model="loginForm.username" class="search-input" autocomplete="username" required /></label>
          <label><span>{{ t("login.password") }}</span><input v-model="loginForm.password" class="search-input" type="password" autocomplete="current-password" required /></label>
          <button class="primary-button" type="submit">{{ t("login.submit") }}</button>
        </form>
        <button class="forgot-button" @click="changeMode('forgot')">{{ t("login.forgot") }}</button>
        <div class="demo-credentials"><strong>{{ t("login.demoTitle") }}</strong><span>{{ t("login.demoHint") }}</span></div>
      </div>
      <div v-else>
        <button class="back-button" @click="changeMode('login')">{{ t("login.back") }}</button>
        <p class="eyebrow">{{ t("login.remindEyebrow") }}</p>
        <h2>{{ t("login.remindTitle") }}</h2>
        <p class="login-description">{{ t("login.remindDescription") }}</p>
        <form class="task-form" @submit.prevent="remindPassword">
          <label><span>{{ t("common.email") }}</span><input v-model="reminderEmail" class="search-input" type="email" autocomplete="email" required /></label>
          <button class="primary-button" type="submit">{{ t("login.send") }}</button>
        </form>
      </div>
      <p v-if="feedback" class="login-feedback" role="status">{{ feedback }}</p>
    </section>
  </main>
</template>
