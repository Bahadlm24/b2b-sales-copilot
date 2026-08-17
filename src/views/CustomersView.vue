<script setup>
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import OwnerSelect from "../components/OwnerSelect.vue";
import SummaryGrid from "../components/SummaryGrid.vue";
import { formatPhoneNumber } from "../services/phoneFormatter";
import { salesStore } from "../stores/salesStore";
const router = useRouter();
const search = ref("");
const showArchived = ref(false);
const feedback = ref("");
const form = reactive({ name: "", contact: "", role: "", phone: "", email: "", sector: "", city: "", stage: "İlk görüşme", score: 50, revenue: "", ownerId: salesStore.currentUser.value.id });
const stages = ["İlk görüşme", "İhtiyaç analizi", "Teklif değerlendiriliyor", "Karar aşaması", "Müşteri"];
const filtered = computed(() => salesStore.customers.filter(x => (showArchived.value ? x.archived : !x.archived) && `${x.name} ${x.contact} ${x.sector} ${x.phone}`.toLocaleLowerCase("tr").includes(search.value.toLocaleLowerCase("tr"))));
const activeCustomers = computed(() => salesStore.customers.filter((item) => !item.archived));
const decisionCount = computed(() => activeCustomers.value.filter((item) => item.stage === "Karar aşaması").length);
function previewPhone() {
  if (form.phone) form.phone = formatPhoneNumber(form.phone);
}
function submitCustomer() {
  const result = salesStore.addCustomer(form);
  feedback.value = result.message || `${result.customer.name} müşteri listesine eklendi.`;
  if (!result.ok) return;
  Object.assign(form, { name: "", contact: "", role: "", phone: "", email: "", sector: "", city: "", stage: "İlk görüşme", score: 50, revenue: "", ownerId: salesStore.currentUser.value.id });
  router.push(`/customers/${result.customer.id}`);
}
function contactAge(item) {
  return Math.max(0, Math.floor((Date.now() - new Date(`${item.lastContactDate}T00:00:00`).getTime()) / 86400000));
}
function contactFreshness(item) {
  const days = contactAge(item);
  if (days >= 10) return { className: "overdue", label: `${days} gündür temas yok` };
  if (days >= 5) return { className: "attention", label: "Takip zamanı" };
  return { className: "fresh", label: "Güncel temas" };
}
</script>

<template>
  <SummaryGrid :items="[
    { label: 'TOPLAM MÜŞTERİ', value: activeCustomers.length, hint: `${salesStore.customers.filter(x => x.archived).length} arşiv kaydı` },
    { label: 'AKTİF FIRSAT', value: salesStore.activeOffers.value.length, hint: new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', notation: 'compact' }).format(salesStore.pipelineValue.value) },
    { label: 'KARAR AŞAMASI', value: decisionCount, hint: 'Aktif müşteriler' },
  ]" />
  <section class="panel customer-create-panel">
    <div class="panel-header"><div><p class="eyebrow">MANUEL KAYIT</p><h3>Yeni müşteri ekle</h3></div><span class="required-note">* Zorunlu alan</span></div>
    <form class="task-form" @submit.prevent="submitCustomer">
      <div class="form-row"><label><span>Firma adı *</span><input v-model="form.name" class="search-input" required /></label><label><span>Telefon *</span><input v-model="form.phone" class="search-input" required placeholder="0530 505 66 48" @blur="previewPhone" /></label></div>
      <div class="form-row"><label><span>Yetkili adı</span><input v-model="form.contact" class="search-input" /></label><label><span>Görevi</span><input v-model="form.role" class="search-input" /></label></div>
      <div class="form-row"><label><span>E-posta</span><input v-model="form.email" class="search-input" type="email" /></label><label><span>Sektör</span><input v-model="form.sector" class="search-input" /></label></div>
      <div class="form-row"><label><span>Şehir</span><input v-model="form.city" class="search-input" /></label><label><span>Aşama</span><select v-model="form.stage" class="select-input"><option v-for="stage in stages" :key="stage">{{ stage }}</option></select></label></div>
      <div class="form-row"><label><span>Sorumlu personel</span><OwnerSelect v-model="form.ownerId" /></label><label><span>Potansiyel tutar</span><input v-model="form.revenue" class="search-input" placeholder="₺250.000" /></label></div>
      <label><span>Fırsat skoru: {{ form.score }}</span><input v-model.number="form.score" class="range-input" type="range" min="0" max="100" /></label>
      <button class="primary-button" type="submit">Müşteri oluştur</button>
      <p v-if="feedback" class="form-feedback" role="status">{{ feedback }}</p>
    </form>
  </section>
  <section class="panel table-panel">
    <div class="list-toolbar">
      <div><p class="eyebrow">MÜŞTERİ LİSTESİ</p><h3>Tüm müşteriler</h3></div>
      <div class="toolbar-actions"><button class="secondary-button" @click="showArchived = !showArchived">{{ showArchived ? "Aktif kayıtlar" : "Arşiv" }}</button><input v-model="search" class="search-input" placeholder="Müşteri veya yetkili ara..." /></div>
    </div>
    <div class="customer-list">
      <RouterLink v-for="item in filtered" :key="item.id" :to="`/customers/${item.id}`" class="customer-row">
        <span class="company-logo small">{{ item.initials }}</span>
        <span class="row-main"><strong>{{ item.name }}</strong><small>{{ item.contact }} · {{ item.role }}</small><small>{{ salesStore.userName(item.ownerId) }}{{ item.archived ? " · Arşivde" : "" }}</small></span>
        <span class="row-cell"><small>Sektör</small><strong>{{ item.sector }}</strong></span>
        <span class="row-cell"><small>Aşama</small><strong>{{ item.stage }}</strong></span>
        <span class="row-cell contact-date" :class="contactFreshness(item).className"><small>Son temas</small><strong>{{ item.lastContact }}</strong><em>{{ contactFreshness(item).label }}</em></span>
        <span class="score-pill">{{ item.score }}</span><span class="row-arrow">→</span>
      </RouterLink>
    </div>
    <p v-if="!filtered.length" class="empty-state">Aramana uygun müşteri bulunamadı.</p>
  </section>
</template>
