<script setup>
import { computed, reactive, ref } from "vue";
import OwnerSelect from "../components/OwnerSelect.vue";
import SummaryGrid from "../components/SummaryGrid.vue";
import { formatMoney, formatStatus, t } from "../i18n/localeStore.js";
import { salesStore } from "../stores/salesStore";
const status = ref("all");
const showArchived = ref(false);
const offers = salesStore.state.offers;
const visibleOffers = computed(() => offers.filter((offer) => Boolean(offer.archived) === showArchived.value));
const filtered = computed(() => status.value === "all" ? visibleOffers.value : visibleOffers.value.filter(x => x.status === status.value));
const offerStatuses = ["Beklemede", "Revize", "Karar", "Hazırlanıyor", "Kazanıldı", "Kaybedildi", "İptal"];
const averageProbability = computed(() => Math.round(salesStore.activeOffers.value.reduce((sum, item) => sum + item.probability, 0) / salesStore.activeOffers.value.length || 0));
const feedback = ref("");
const form = reactive({ customerId: salesStore.customers.find((item) => !item.archived)?.id, title: "", numericAmount: "", validUntil: "", probability: 50, ownerId: salesStore.currentUser.value.id });
const summaryItems = computed(() => [
  { label: t("offers.open"), value: salesStore.activeOffers.value.length, hint: t("offers.activeProcess") },
  { label: t("offers.totalAmount"), value: formatMoney(salesStore.activeOffers.value.reduce((sum, x) => sum + x.numericAmount, 0)), hint: t("offers.openValue") },
  { label: t("offers.avgProb"), value: `%${averageProbability.value}`, hint: t("offers.openOffers") },
]);
function submitOffer() {
  const result = salesStore.addOffer(form);
  feedback.value = result.message || t("offers.created", { no: result.offer.no });
  if (result.ok) Object.assign(form, { customerId: salesStore.customers.find((item) => !item.archived)?.id, title: "", numericAmount: "", validUntil: "", probability: 50, ownerId: salesStore.currentUser.value.id });
}
</script>

<template>
  <SummaryGrid :items="summaryItems" />
  <section class="panel offer-create-panel">
    <div class="panel-header"><div><p class="eyebrow">{{ t("offers.createEyebrow") }}</p><h3>{{ t("offers.createTitle") }}</h3></div></div>
    <form class="task-form" @submit.prevent="submitOffer">
      <div class="form-row"><label><span>{{ t("offers.customer") }}</span><select v-model.number="form.customerId" class="select-input" required><option v-for="customer in salesStore.customers.filter(x => !x.archived)" :key="customer.id" :value="customer.id">{{ customer.name }}</option></select></label><label><span>{{ t("offers.title") }}</span><input v-model="form.title" class="search-input" required /></label></div>
      <div class="form-row"><label><span>{{ t("offers.amount") }}</span><input v-model.number="form.numericAmount" class="search-input" type="number" min="1" required /></label><label><span>{{ t("offers.validUntil") }}</span><input v-model="form.validUntil" class="search-input" type="date" required /></label></div>
      <div class="form-row"><label><span>{{ t("common.ownerStaff") }}</span><OwnerSelect v-model="form.ownerId" /></label><label><span>{{ t("offers.probability", { value: form.probability }) }}</span><input v-model.number="form.probability" class="range-input" type="range" min="0" max="100" /></label></div>
      <button class="primary-button" type="submit">{{ t("offers.create") }}</button>
      <p v-if="feedback" class="form-feedback" role="status">{{ feedback }}</p>
    </form>
  </section>
  <section class="panel table-panel">
    <div class="list-toolbar">
      <div><p class="eyebrow">{{ t("offers.poolEyebrow") }}</p><h3>{{ t("offers.poolTitle") }}</h3></div>
      <div class="toolbar-actions"><button class="secondary-button" @click="showArchived = !showArchived">{{ showArchived ? t("common.activeRecords") : t("common.archiveNoun") }}</button><select v-model="status" class="select-input"><option value="all">{{ t("common.all") }}</option><option v-for="item in offerStatuses" :key="item" :value="item">{{ formatStatus(item) }}</option></select></div>
    </div>
    <div class="offer-table">
      <div class="table-head"><span>{{ t("offers.colOffer") }}</span><span>{{ t("offers.colCustomer") }}</span><span>{{ t("offers.colAmount") }}</span><span>{{ t("offers.colProb") }}</span><span>{{ t("offers.colStatus") }}</span></div>
      <RouterLink v-for="offer in filtered" :key="offer.id" class="table-row offer-row-link" :to="`/offers/${offer.id}`">
        <span><strong>{{ offer.title }}</strong><small>{{ offer.no }}</small></span><span>{{ offer.customer }}</span><span><strong>{{ formatMoney(offer.numericAmount) }}</strong></span>
        <span><i class="progress"><b :style="{ width: `${offer.probability}%` }"></b></i>%{{ offer.probability }}</span><span class="offer-status">{{ formatStatus(offer.status) }}</span>
      </RouterLink>
    </div>
  </section>
</template>
