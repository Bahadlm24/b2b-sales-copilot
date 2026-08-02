<script setup>
import { reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
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
      <span class="brand-mark large-mark">S</span>
      <p class="eyebrow light">B2B SATIŞ ÇALIŞMA ALANI</p>
      <h1>Satış ekibinin karar merkezi.</h1>
      <p>Müşterileri, teklifleri, takipleri ve toplantı içgörülerini tek yerde yönet.</p>
    </section>
    <section class="login-card">
      <div v-if="mode === 'login'">
        <p class="eyebrow">GÜVENLİ GİRİŞ</p>
        <h2>Hesabına giriş yap</h2>
        <p class="login-description">Devam etmek için kullanıcı bilgilerini gir.</p>
        <form class="task-form" @submit.prevent="login">
          <label><span>Kullanıcı adı</span><input v-model="loginForm.username" class="search-input" autocomplete="username" required /></label>
          <label><span>Şifre</span><input v-model="loginForm.password" class="search-input" type="password" autocomplete="current-password" required /></label>
          <button class="primary-button" type="submit">Giriş yap</button>
        </form>
        <button class="forgot-button" @click="changeMode('forgot')">Şifremi unuttum</button>
        <div class="demo-credentials"><strong>Mock yönetici hesabı</strong><span>Kullanıcı: admin · Şifre: 1234</span></div>
      </div>
      <div v-else>
        <button class="back-button" @click="changeMode('login')">← Giriş ekranına dön</button>
        <p class="eyebrow">ŞİFRE HATIRLATMA</p>
        <h2>E-posta adresini gir</h2>
        <p class="login-description">Kayıtlı hesaba ait giriş bilgisi mock e-posta kuyruğuna eklenecek.</p>
        <form class="task-form" @submit.prevent="remindPassword">
          <label><span>E-posta</span><input v-model="reminderEmail" class="search-input" type="email" autocomplete="email" required /></label>
          <button class="primary-button" type="submit">Bilgilendirme gönder</button>
        </form>
      </div>
      <p v-if="feedback" class="login-feedback" role="status">{{ feedback }}</p>
    </section>
  </main>
</template>
