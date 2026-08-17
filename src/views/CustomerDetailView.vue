<script setup>
import { computed, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import ActivityTimeline from "../components/ActivityTimeline.vue";
import OwnerSelect from "../components/OwnerSelect.vue";
import { salesStore } from "../stores/salesStore";
const route = useRoute();
const customer = computed(() => salesStore.customers.find(x => x.id === Number(route.params.id)) || null);
const customerOffers = computed(() => customer.value ? salesStore.state.offers.filter(x => x.customerId === customer.value.id) : []);
const editing = ref(false);
const feedback = ref("");
const stages = ["İlk görüşme", "İhtiyaç analizi", "Teklif değerlendiriliyor", "Karar aşaması", "Müşteri"];
const form = reactive({});
function startEditing() {
  Object.assign(form, {
    name: customer.value.name,
    contact: customer.value.contact,
    role: customer.value.role,
    phone: customer.value.phone,
    email: customer.value.email,
    sector: customer.value.sector,
    city: customer.value.city,
    stage: customer.value.stage,
    score: customer.value.score,
    revenue: customer.value.revenue,
    ownerId: customer.value.ownerId,
  });
  feedback.value = "";
  editing.value = true;
}
function saveCustomer() {
  const result = salesStore.updateCustomer(customer.value.id, form);
  feedback.value = result.message || (result.unchanged ? "Değişiklik bulunamadı." : "Müşteri bilgileri ve audit kaydı güncellendi.");
  if (result.ok && !result.unchanged) editing.value = false;
}
</script>

<template>
  <template v-if="customer">
  <RouterLink class="back-link" to="/customers">← Müşterilere dön</RouterLink>
  <section class="detail-hero">
    <span class="company-logo large">{{ customer.initials }}</span>
    <div class="customer-main">
      <div class="title-row"><h2>{{ customer.name }}</h2><span class="stage-badge">{{ customer.stage }}</span></div>
      <p>{{ customer.sector }} · {{ customer.city }}</p>
    </div>
    <div class="detail-actions">
      <button class="secondary-button" @click="startEditing">Bilgileri düzenle</button>
      <button class="secondary-button danger-subtle" @click="salesStore.archiveCustomer(customer.id, !customer.archived)">{{ customer.archived ? "Aktifleştir" : "Arşivle" }}</button>
      <RouterLink class="primary-button compact link-button" :to="{ name: 'meeting', query: { customer: customer.id } }">Toplantı başlat</RouterLink>
    </div>
  </section>
  <section v-if="editing" class="panel customer-edit-panel">
    <div class="panel-header"><div><p class="eyebrow">MÜŞTERİ GÜNCELLEME</p><h3>Firma ve iletişim bilgileri</h3></div><button class="icon-button" aria-label="Düzenlemeyi kapat" @click="editing = false">×</button></div>
    <form class="task-form" @submit.prevent="saveCustomer">
      <div class="form-row"><label><span>Firma adı *</span><input v-model="form.name" class="search-input" required /></label><label><span>Telefon *</span><input v-model="form.phone" class="search-input" required /></label></div>
      <div class="form-row"><label><span>Yetkili</span><input v-model="form.contact" class="search-input" /></label><label><span>Görevi</span><input v-model="form.role" class="search-input" /></label></div>
      <div class="form-row"><label><span>E-posta</span><input v-model="form.email" class="search-input" type="email" /></label><label><span>Sektör</span><input v-model="form.sector" class="search-input" /></label></div>
      <div class="form-row"><label><span>Şehir</span><input v-model="form.city" class="search-input" /></label><label><span>Aşama</span><select v-model="form.stage" class="select-input"><option v-for="stage in stages" :key="stage">{{ stage }}</option></select></label></div>
      <div class="form-row"><label><span>Sorumlu personel</span><OwnerSelect v-model="form.ownerId" /></label><label><span>Potansiyel tutar</span><input v-model="form.revenue" class="search-input" /></label></div>
      <label><span>Fırsat skoru: {{ form.score }}</span><input v-model.number="form.score" class="range-input" type="range" min="0" max="100" /></label>
      <button class="primary-button" type="submit">Değişiklikleri kaydet</button>
    </form>
  </section>
  <p v-if="feedback" class="form-feedback customer-detail-feedback" role="status">{{ feedback }}</p>
  <div class="detail-grid">
    <section class="panel">
      <p class="eyebrow">İLETİŞİM</p><h3>Müşteri yetkilisi</h3>
      <dl class="detail-list"><div><dt>Ad soyad</dt><dd>{{ customer.contact }}</dd></div><div><dt>Görevi</dt><dd>{{ customer.role }}</dd></div><div><dt>Telefon</dt><dd>{{ customer.phone }}</dd></div><div><dt>E-posta</dt><dd>{{ customer.email }}</dd></div><div><dt>Sorumlu</dt><dd>{{ salesStore.userName(customer.ownerId) }}</dd></div></dl>
    </section>
    <section class="panel">
      <p class="eyebrow">FIRSAT ÖZETİ</p><h3>Satış görünümü</h3>
      <div class="score-display"><strong>{{ customer.score }}</strong><span>/100<br />fırsat skoru</span></div>
      <dl class="detail-list"><div><dt>Potansiyel</dt><dd>{{ customer.revenue }}</dd></div><div><dt>Son temas</dt><dd>{{ customer.lastContact }}</dd></div></dl>
    </section>
    <section class="panel detail-wide">
      <div class="panel-header"><div><p class="eyebrow">TEKLİFLER</p><h3>Müşteriye ait teklifler</h3></div><span class="count-badge">{{ customerOffers.length }}</span></div>
      <RouterLink v-for="offer in customerOffers" :key="offer.id" class="offer offer-card-link" :to="`/offers/${offer.id}`"><div class="offer-top"><span>{{ offer.no }}</span><span class="offer-status">{{ offer.status }}</span></div><h4>{{ offer.title }}</h4><div class="offer-bottom"><strong>{{ offer.amount }}</strong><small>Başarı ihtimali: %{{ offer.probability }}</small></div></RouterLink>
      <p v-if="!customerOffers.length" class="empty-state">Bu müşteriye ait açık teklif bulunmuyor.</p>
    </section>
    <section class="panel detail-wide">
      <ActivityTimeline entity-type="customer" :entity-id="customer.id" />
    </section>
  </div>
  </template>
  <section v-else class="panel not-found"><span>404</span><h2>Müşteri bulunamadı.</h2><RouterLink class="primary-button compact link-button" to="/customers">Müşterilere dön</RouterLink></section>
</template>
