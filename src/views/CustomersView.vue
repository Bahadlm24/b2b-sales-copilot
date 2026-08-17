<script setup>
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import OwnerSelect from "../components/OwnerSelect.vue";
import SummaryGrid from "../components/SummaryGrid.vue";
import { dateLocale, formatDate, formatMoney, formatStatus, t } from "../i18n/localeStore.js";
import { formatPhoneNumber } from "../services/phoneFormatter";
import { salesStore } from "../stores/salesStore";
const router = useRouter();
const search = ref("");
const showArchived = ref(false);
const feedback = ref("");
const form = reactive({ name: "", contact: "", role: "", phone: "", email: "", sector: "", city: "", stage: "İlk görüşme", score: 50, revenue: "", ownerId: salesStore.currentUser.value.id });
const stages = ["İlk görüşme", "İhtiyaç analizi", "Teklif değerlendiriliyor", "Karar aşaması", "Müşteri"];
const filtered = computed(() => salesStore.customers.filter(x => (showArchived.value ? x.archived : !x.archived) && `${x.name} ${x.contact} ${x.sector} ${x.phone}`.toLocaleLowerCase(dateLocale.value).includes(search.value.toLocaleLowerCase(dateLocale.value))));
const activeCustomers = computed(() => salesStore.customers.filter((item) => !item.archived));
const decisionCount = computed(() => activeCustomers.value.filter((item) => item.stage === "Karar aşaması").length);
const summaryItems = computed(() => [
  { label: t("customers.total"), value: activeCustomers.value.length, hint: t("customers.archivedHint", { count: salesStore.customers.filter(x => x.archived).length }) },
  { label: t("customers.activeOpportunity"), value: salesStore.activeOffers.value.length, hint: formatMoney(salesStore.pipelineValue.value, { notation: "compact" }) },
  { label: t("customers.decision"), value: decisionCount.value, hint: t("customers.activeCustomers") },
]);
function previewPhone() {
  if (form.phone) form.phone = formatPhoneNumber(form.phone);
}
function submitCustomer() {
  const result = salesStore.addCustomer(form);
  feedback.value = result.message || t("customers.added", { name: result.customer.name });
  if (!result.ok) return;
  Object.assign(form, { name: "", contact: "", role: "", phone: "", email: "", sector: "", city: "", stage: "İlk görüşme", score: 50, revenue: "", ownerId: salesStore.currentUser.value.id });
  router.push(`/customers/${result.customer.id}`);
}
function contactAge(item) {
  return Math.max(0, Math.floor((Date.now() - new Date(`${item.lastContactDate}T00:00:00`).getTime()) / 86400000));
}
function contactFreshness(item) {
  const days = contactAge(item);
  if (days >= 10) return { className: "overdue", label: t("customers.noContactDays", { days }) };
  if (days >= 5) return { className: "attention", label: t("customers.followUp") };
  return { className: "fresh", label: t("customers.fresh") };
}
</script>

<template>
  <SummaryGrid :items="summaryItems" />
  <section class="panel customer-create-panel">
    <div class="panel-header"><div><p class="eyebrow">{{ t("customers.createEyebrow") }}</p><h3>{{ t("customers.createTitle") }}</h3></div><span class="required-note">{{ t("common.required") }}</span></div>
    <form class="task-form" @submit.prevent="submitCustomer">
      <div class="form-row"><label><span>{{ t("customers.companyName") }}</span><input v-model="form.name" class="search-input" required /></label><label><span>{{ t("customers.phoneRequired") }}</span><input v-model="form.phone" class="search-input" required placeholder="0530 505 66 48" @blur="previewPhone" /></label></div>
      <div class="form-row"><label><span>{{ t("customers.contact") }}</span><input v-model="form.contact" class="search-input" /></label><label><span>{{ t("customers.role") }}</span><input v-model="form.role" class="search-input" /></label></div>
      <div class="form-row"><label><span>{{ t("common.email") }}</span><input v-model="form.email" class="search-input" type="email" /></label><label><span>{{ t("customers.sector") }}</span><input v-model="form.sector" class="search-input" /></label></div>
      <div class="form-row"><label><span>{{ t("customers.city") }}</span><input v-model="form.city" class="search-input" /></label><label><span>{{ t("customers.stage") }}</span><select v-model="form.stage" class="select-input"><option v-for="stage in stages" :key="stage" :value="stage">{{ formatStatus(stage) }}</option></select></label></div>
      <div class="form-row"><label><span>{{ t("common.ownerStaff") }}</span><OwnerSelect v-model="form.ownerId" /></label><label><span>{{ t("customers.revenue") }}</span><input v-model="form.revenue" class="search-input" placeholder="₺250.000" /></label></div>
      <label><span>{{ t("customers.score", { score: form.score }) }}</span><input v-model.number="form.score" class="range-input" type="range" min="0" max="100" /></label>
      <button class="primary-button" type="submit">{{ t("customers.create") }}</button>
      <p v-if="feedback" class="form-feedback" role="status">{{ feedback }}</p>
    </form>
  </section>
  <section class="panel table-panel">
    <div class="list-toolbar">
      <div><p class="eyebrow">{{ t("customers.listEyebrow") }}</p><h3>{{ t("customers.listTitle") }}</h3></div>
      <div class="toolbar-actions"><button class="secondary-button" @click="showArchived = !showArchived">{{ showArchived ? t("common.activeRecords") : t("common.archiveNoun") }}</button><input v-model="search" class="search-input" :placeholder="t('customers.search')" /></div>
    </div>
    <div class="customer-list">
      <RouterLink v-for="item in filtered" :key="item.id" :to="`/customers/${item.id}`" class="customer-row">
        <span class="company-logo small">{{ item.initials }}</span>
        <span class="row-main"><strong>{{ item.name }}</strong><small>{{ item.contact }} · {{ item.role }}</small><small>{{ salesStore.userName(item.ownerId) }}{{ item.archived ? t("customers.inArchive") : "" }}</small></span>
        <span class="row-cell"><small>{{ t("customers.sectorLabel") }}</small><strong>{{ item.sector }}</strong></span>
        <span class="row-cell"><small>{{ t("customers.stageLabel") }}</small><strong>{{ formatStatus(item.stage) }}</strong></span>
        <span class="row-cell contact-date" :class="contactFreshness(item).className"><small>{{ t("customers.lastContact") }}</small><strong>{{ formatDate(item.lastContactDate, { dateStyle: "medium" }) }}</strong><em>{{ contactFreshness(item).label }}</em></span>
        <span class="score-pill">{{ item.score }}</span><span class="row-arrow">→</span>
      </RouterLink>
    </div>
    <p v-if="!filtered.length" class="empty-state">{{ t("customers.empty") }}</p>
  </section>
</template>
