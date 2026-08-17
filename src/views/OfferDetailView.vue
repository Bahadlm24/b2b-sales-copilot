<script setup>
import { computed, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import ActivityTimeline from "../components/ActivityTimeline.vue";
import OwnerSelect from "../components/OwnerSelect.vue";
import { salesStore } from "../stores/salesStore";

const route = useRoute();
const offer = computed(() => salesStore.state.offers.find((item) => item.id === Number(route.params.id)));
const form = reactive(offer.value ? { ...offer.value } : {});
const statuses = ["Hazırlanıyor", "Beklemede", "Revize", "Karar", "Kazanıldı", "Kaybedildi"];
const feedback = ref("");
const cancelReason = ref("");
const fieldLabels = { title: "Teklif başlığı", status: "Durum", probability: "Olasılık", validUntil: "Geçerlilik", numericAmount: "Tutar", amount: "Biçimlendirilmiş tutar", ownerId: "Sorumlu", outcomeReason: "Sonuç nedeni", cancelled: "İptal" };
function displayValue(field, value) {
  if (field === "ownerId") return salesStore.userName(value);
  if (value === true) return "Evet";
  if (value === false) return "Hayır";
  return value === "" || value == null ? "—" : value;
}
function saveOffer() {
  if (["Kazanıldı", "Kaybedildi"].includes(form.status) && !form.outcomeReason?.trim()) {
    feedback.value = "Kazanıldı veya kaybedildi durumunda sonuç nedeni zorunludur.";
    return;
  }
  salesStore.updateOffer(offer.value.id, form);
  feedback.value = "Teklif güncellendi ve revizyon geçmişine eklendi.";
}
function cancelCurrentOffer() {
  if (!cancelReason.value.trim()) {
    feedback.value = "İptal nedeni zorunludur.";
    return;
  }
  if (salesStore.cancelOffer(offer.value.id, cancelReason.value)) {
    Object.assign(form, offer.value);
    feedback.value = "Teklif iptal edildi.";
    cancelReason.value = "";
  }
}
</script>

<template>
  <template v-if="offer">
    <RouterLink class="back-link" to="/offers">← Tekliflere dön</RouterLink>
    <section class="detail-hero">
      <span class="company-logo large">₺</span>
      <div class="customer-main"><div class="title-row"><h2>{{ offer.title }}</h2><span class="stage-badge">{{ offer.status }}</span></div><p>{{ offer.customer }} · {{ offer.no }}</p></div>
      <div class="detail-actions"><strong class="offer-hero-amount">{{ offer.amount }}</strong><button class="secondary-button" @click="salesStore.archiveOffer(offer.id, !offer.archived)">{{ offer.archived ? "Aktifleştir" : "Arşivle" }}</button></div>
    </section>
    <div class="detail-grid">
      <section class="panel">
        <p class="eyebrow">TEKLİF GÜNCELLEME</p><h3>Satış koşulları</h3>
        <form class="task-form" @submit.prevent="saveOffer">
          <label><span>Teklif başlığı</span><input v-model="form.title" class="search-input" required /></label>
          <div class="form-row"><label><span>Tutar (₺)</span><input v-model.number="form.numericAmount" class="search-input" type="number" min="0" required /></label><label><span>Geçerlilik</span><input v-model="form.validUntil" class="search-input" required /></label></div>
          <div class="form-row"><label><span>Durum</span><select v-model="form.status" class="select-input"><option v-for="status in statuses" :key="status">{{ status }}</option></select></label><label><span>Olasılık: %{{ form.probability }}</span><input v-model="form.probability" class="range-input" type="range" min="0" max="100" /></label></div>
          <label><span>Sorumlu personel</span><OwnerSelect v-model="form.ownerId" /></label>
          <label v-if="['Kazanıldı', 'Kaybedildi'].includes(form.status)"><span>Sonuç nedeni *</span><textarea v-model="form.outcomeReason" class="compact-textarea" required placeholder="Teklif neden kazanıldı veya kaybedildi?" /></label>
          <button class="primary-button" type="submit">Teklifi güncelle</button>
          <p v-if="feedback" class="form-feedback" role="status">{{ feedback }}</p>
        </form>
        <div v-if="!offer.cancelled && !['Kazanıldı', 'Kaybedildi'].includes(offer.status)" class="cancel-offer-box"><input v-model="cancelReason" class="search-input" placeholder="İptal nedeni" /><button class="danger-button" @click="cancelCurrentOffer">Teklifi iptal et</button></div>
      </section>
      <section class="panel">
        <p class="eyebrow">MÜŞTERİ</p><h3>İlişkili kayıt</h3>
        <dl class="detail-list"><div><dt>Firma</dt><dd>{{ offer.customer }}</dd></div><div><dt>Teklif no</dt><dd>{{ offer.no }}</dd></div><div><dt>Sorumlu</dt><dd>{{ salesStore.userName(offer.ownerId) }}</dd></div><div><dt>Olasılık</dt><dd>%{{ offer.probability }}</dd></div><div><dt>Sonuç nedeni</dt><dd>{{ offer.outcomeReason || "—" }}</dd></div><div><dt>Son güncelleme</dt><dd>{{ offer.updatedAt ? new Date(offer.updatedAt).toLocaleString("tr-TR") : "—" }}</dd></div></dl>
        <RouterLink class="secondary-button link-button" :to="`/customers/${offer.customerId}`">Müşteri kartını aç</RouterLink>
      </section>
      <section class="panel detail-wide">
        <div class="panel-header"><div><p class="eyebrow">REVİZYON GEÇMİŞİ</p><h3>Teklif değişiklikleri</h3></div><span class="count-badge">{{ offer.revisions?.length || 0 }}</span></div>
        <div class="revision-list"><article v-for="revision in offer.revisions" :key="revision.id"><strong>{{ revision.actorName }}</strong><small>{{ new Date(revision.createdAt).toLocaleString("tr-TR") }}</small><div class="revision-changes"><p v-for="field in revision.changedFields" :key="field"><b>{{ fieldLabels[field] || field }}</b><span>{{ displayValue(field, revision.before[field]) }}</span><i>→</i><span>{{ displayValue(field, revision.after[field]) }}</span></p></div></article><p v-if="!offer.revisions?.length" class="empty-state">Henüz revizyon yok.</p></div>
      </section>
      <section class="panel detail-wide"><ActivityTimeline entity-type="customer" :entity-id="offer.customerId" /></section>
    </div>
  </template>
  <section v-else class="panel not-found"><span>404</span><h2>Teklif bulunamadı.</h2><RouterLink class="primary-button compact link-button" to="/offers">Tekliflere dön</RouterLink></section>
</template>
