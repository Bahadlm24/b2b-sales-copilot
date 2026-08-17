<script setup>
import { computed, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import ActivityTimeline from "../components/ActivityTimeline.vue";
import OwnerSelect from "../components/OwnerSelect.vue";
import { formatDate, formatMoney, formatStatus, t } from "../i18n/localeStore.js";
import { salesStore } from "../stores/salesStore";

const route = useRoute();
const offer = computed(() => salesStore.state.offers.find((item) => item.id === Number(route.params.id)));
const form = reactive(offer.value ? { ...offer.value } : {});
const statuses = ["Hazırlanıyor", "Beklemede", "Revize", "Karar", "Kazanıldı", "Kaybedildi"];
const feedback = ref("");
const cancelReason = ref("");
function displayValue(field, value) {
  if (field === "ownerId") return salesStore.userName(value);
  if (field === "status") return formatStatus(value);
  if (field === "numericAmount") return formatMoney(value);
  if (value === true) return t("common.yes");
  if (value === false) return t("common.no");
  return value === "" || value == null ? t("common.dash") : value;
}
function saveOffer() {
  if (["Kazanıldı", "Kaybedildi"].includes(form.status) && !form.outcomeReason?.trim()) {
    feedback.value = t("offerDetail.outcomeRequired");
    return;
  }
  salesStore.updateOffer(offer.value.id, form);
  feedback.value = t("offerDetail.updated");
}
function cancelCurrentOffer() {
  if (!cancelReason.value.trim()) {
    feedback.value = t("offerDetail.cancelReason");
    return;
  }
  if (salesStore.cancelOffer(offer.value.id, cancelReason.value)) {
    Object.assign(form, offer.value);
    feedback.value = t("offerDetail.cancelled");
    cancelReason.value = "";
  }
}
</script>

<template>
  <template v-if="offer">
    <RouterLink class="back-link" to="/offers">{{ t("offerDetail.back") }}</RouterLink>
    <section class="detail-hero">
      <span class="company-logo large">₺</span>
      <div class="customer-main"><div class="title-row"><h2>{{ offer.title }}</h2><span class="stage-badge">{{ formatStatus(offer.status) }}</span></div><p>{{ offer.customer }} · {{ offer.no }}</p></div>
      <div class="detail-actions"><strong class="offer-hero-amount">{{ formatMoney(offer.numericAmount) }}</strong><button class="secondary-button" @click="salesStore.archiveOffer(offer.id, !offer.archived)">{{ offer.archived ? t("common.activate") : t("common.archive") }}</button></div>
    </section>
    <div class="detail-grid">
      <section class="panel">
        <p class="eyebrow">{{ t("offerDetail.updateEyebrow") }}</p><h3>{{ t("offerDetail.updateTitle") }}</h3>
        <form class="task-form" @submit.prevent="saveOffer">
          <label><span>{{ t("offerDetail.title") }}</span><input v-model="form.title" class="search-input" required /></label>
          <div class="form-row"><label><span>{{ t("offerDetail.amount") }}</span><input v-model.number="form.numericAmount" class="search-input" type="number" min="0" required /></label><label><span>{{ t("offerDetail.validUntil") }}</span><input v-model="form.validUntil" class="search-input" required /></label></div>
          <div class="form-row"><label><span>{{ t("common.status") }}</span><select v-model="form.status" class="select-input"><option v-for="item in statuses" :key="item" :value="item">{{ formatStatus(item) }}</option></select></label><label><span>{{ t("offerDetail.probability", { value: form.probability }) }}</span><input v-model="form.probability" class="range-input" type="range" min="0" max="100" /></label></div>
          <label><span>{{ t("common.ownerStaff") }}</span><OwnerSelect v-model="form.ownerId" /></label>
          <label v-if="['Kazanıldı', 'Kaybedildi'].includes(form.status)"><span>{{ t("offerDetail.outcome") }}</span><textarea v-model="form.outcomeReason" class="compact-textarea" required :placeholder="t('offerDetail.outcomePh')" /></label>
          <button class="primary-button" type="submit">{{ t("offerDetail.save") }}</button>
          <p v-if="feedback" class="form-feedback" role="status">{{ feedback }}</p>
        </form>
        <div v-if="!offer.cancelled && !['Kazanıldı', 'Kaybedildi'].includes(offer.status)" class="cancel-offer-box"><input v-model="cancelReason" class="search-input" :placeholder="t('offerDetail.cancelPh')" /><button class="danger-button" @click="cancelCurrentOffer">{{ t("offerDetail.cancel") }}</button></div>
      </section>
      <section class="panel">
        <p class="eyebrow">{{ t("offerDetail.customerEyebrow") }}</p><h3>{{ t("offerDetail.related") }}</h3>
        <dl class="detail-list"><div><dt>{{ t("common.company") }}</dt><dd>{{ offer.customer }}</dd></div><div><dt>{{ t("offerDetail.offerNo") }}</dt><dd>{{ offer.no }}</dd></div><div><dt>{{ t("common.owner") }}</dt><dd>{{ salesStore.userName(offer.ownerId) }}</dd></div><div><dt>{{ t("offerDetail.probabilityLabel") }}</dt><dd>%{{ offer.probability }}</dd></div><div><dt>{{ t("offerDetail.outcomeLabel") }}</dt><dd>{{ offer.outcomeReason || t("common.dash") }}</dd></div><div><dt>{{ t("offerDetail.updatedAt") }}</dt><dd>{{ offer.updatedAt ? formatDate(offer.updatedAt) : t("common.dash") }}</dd></div></dl>
        <RouterLink class="secondary-button link-button" :to="`/customers/${offer.customerId}`">{{ t("offerDetail.openCustomer") }}</RouterLink>
      </section>
      <section class="panel detail-wide">
        <div class="panel-header"><div><p class="eyebrow">{{ t("offerDetail.revisionEyebrow") }}</p><h3>{{ t("offerDetail.revisionTitle") }}</h3></div><span class="count-badge">{{ offer.revisions?.length || 0 }}</span></div>
        <div class="revision-list"><article v-for="revision in offer.revisions" :key="revision.id"><strong>{{ revision.actorName }}</strong><small>{{ formatDate(revision.createdAt) }}</small><div class="revision-changes"><p v-for="field in revision.changedFields" :key="field"><b>{{ t(`offerDetail.fields.${field}`) === `offerDetail.fields.${field}` ? field : t(`offerDetail.fields.${field}`) }}</b><span>{{ displayValue(field, revision.before[field]) }}</span><i>→</i><span>{{ displayValue(field, revision.after[field]) }}</span></p></div></article><p v-if="!offer.revisions?.length" class="empty-state">{{ t("offerDetail.noRevisions") }}</p></div>
      </section>
      <section class="panel detail-wide"><ActivityTimeline entity-type="customer" :entity-id="offer.customerId" /></section>
    </div>
  </template>
  <section v-else class="panel not-found"><span>404</span><h2>{{ t("offerDetail.missing") }}</h2><RouterLink class="primary-button compact link-button" to="/offers">{{ t("offerDetail.back") }}</RouterLink></section>
</template>
