<script setup>
import { computed, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useNotifications } from "../composables/useNotifications";
import { salesStore } from "../stores/salesStore";
import { themeStore } from "../stores/themeStore";

const route = useRoute();
const router = useRouter();
const { notificationsOpen, notifications, openNotification } = useNotifications();
const titles = {
  dashboard: ["SATIŞ KONTROL MERKEZİ", "Genel Bakış"],
  leads: ["TALEP YÖNETİMİ", "Potansiyel Müşteriler"],
  "lead-detail": ["TALEP YÖNETİMİ", "Potansiyel Müşteri Detayı"],
  meeting: ["SATIŞ ÇALIŞMA ALANI", "Toplantı Asistanı"],
  "meeting-history": ["SATIŞ HAFIZASI", "Toplantı Geçmişi"],
  "meeting-tracker": ["SATIŞ TAKİP MERKEZİ", "Toplantı Takibi"],
  tasks: ["AKSİYON YÖNETİMİ", "Takipler"],
  customers: ["MÜŞTERİ YÖNETİMİ", "Müşteriler"],
  "customer-detail": ["MÜŞTERİ YÖNETİMİ", "Müşteri Detayı"],
  offers: ["SATIŞ TAKİBİ", "Teklifler"],
  "offer-detail": ["SATIŞ TAKİBİ", "Teklif Detayı"],
  analytics: ["SATIŞ ZEKÂSI", "Analizler"],
  "sales-reports": ["YÖNETİM RAPORLARI", "Satış Sonuçları"],
  users: ["SİSTEM YÖNETİMİ", "Kullanıcılar ve Roller"],
  settings: ["SİSTEM AYARLARI", "Yetki ve Organizasyon"],
  integrations: ["SERVİS BAĞLANTILARI", "Gelen Data Entegrasyonları"],
  audit: ["SİSTEM KAYITLARI", "Audit ve Mail Geçmişi"],
  "access-denied": ["ERİŞİM KONTROLÜ", "Yetkisiz Erişim"],
};
const pageTitle = computed(() => titles[route.name] || [salesStore.state.organization.productName.toLocaleUpperCase("tr-TR"), "Sayfa"]);
const activeUser = computed(() => salesStore.currentUser.value || {
  name: "Kullanıcı",
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
      <nav class="nav" aria-label="Ana menü">
        <RouterLink class="nav-item" to="/"><span>⌂</span> Genel Bakış</RouterLink>
        <RouterLink v-if="salesStore.can('leads')" class="nav-item" to="/leads"><span>＋</span> Lead Havuzu</RouterLink>
        <RouterLink v-if="salesStore.can('meeting')" class="nav-item" to="/meeting"><span>◫</span> Toplantı</RouterLink>
        <RouterLink v-if="salesStore.can('meetings')" class="nav-item" to="/meetings"><span>≡</span> Geçmiş</RouterLink>
        <RouterLink v-if="salesStore.can('meetings')" class="nav-item" to="/meeting-tracker"><span>▦</span> Toplantı Takibi</RouterLink>
        <RouterLink v-if="salesStore.can('tasks')" class="nav-item" to="/tasks"><span>✓</span> Takipler</RouterLink>
        <RouterLink v-if="salesStore.can('customers')" class="nav-item" to="/customers"><span>◎</span> Müşteriler</RouterLink>
        <RouterLink v-if="salesStore.can('offers')" class="nav-item" to="/offers"><span>◇</span> Teklifler</RouterLink>
        <RouterLink v-if="salesStore.can('analytics')" class="nav-item" to="/analytics"><span>↗</span> Analizler</RouterLink>
        <RouterLink v-if="salesStore.can('analytics')" class="nav-item" to="/reports"><span>▥</span> Satış Raporları</RouterLink>
        <RouterLink v-if="activeUser.role === 'admin' && salesStore.can('users')" class="nav-item" to="/users"><span>⚙</span> Kullanıcılar</RouterLink>
        <RouterLink v-if="activeUser.role === 'admin' && salesStore.can('settings')" class="nav-item" to="/settings"><span>⋯</span> Ayarlar</RouterLink>
        <RouterLink v-if="salesStore.can('audit')" class="nav-item" to="/audit"><span>◷</span> Audit Log</RouterLink>
      </nav>
      <div class="sidebar-bottom">
        <small class="organization-label">{{ salesStore.state.organization.name }}</small>
        <div class="profile">
          <span class="avatar">{{ activeUserInitials }}</span>
          <span><strong>{{ activeUser.name }}</strong><small>{{ salesStore.roleLabel(activeUser.role) }}</small></span>
        </div>
        <button class="logout-button" @click="logout">Çıkış yap</button>
      </div>
    </aside>

    <main class="main">
      <header class="topbar">
        <div>
          <p class="eyebrow">{{ pageTitle[0] }}</p>
          <h1>{{ pageTitle[1] }}</h1>
        </div>
        <div class="top-actions">
          <button
            class="theme-toggle"
            :aria-label="themeStore.isDark.value ? 'Açık temaya geç' : 'Koyu temaya geç'"
            :title="themeStore.isDark.value ? 'Açık tema' : 'Koyu tema'"
            @click="themeStore.toggle"
          >
            <span aria-hidden="true">{{ themeStore.isDark.value ? "☀" : "◐" }}</span>
            {{ themeStore.isDark.value ? "Açık" : "Koyu" }}
          </button>
          <div class="notification-center">
            <button class="icon-button notification-button" aria-label="Bildirimler" @click="notificationsOpen = !notificationsOpen">●<b v-if="notifications.length">{{ notifications.length }}</b></button>
            <div v-if="notificationsOpen" class="notification-popover">
              <div class="panel-header"><strong>Bildirimler</strong><span>{{ notifications.length }}</span></div>
              <RouterLink v-for="item in notifications" :key="item.id" :to="item.to" @click="openNotification(item)"><small>{{ item.type }}</small><span>{{ item.text }}</span></RouterLink>
              <p v-if="!notifications.length">Yeni bildirim yok.</p>
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
