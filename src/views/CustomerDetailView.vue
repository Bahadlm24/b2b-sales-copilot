<script setup>
import { computed, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import ActivityTimeline from "../components/ActivityTimeline.vue";
import OwnerSelect from "../components/OwnerSelect.vue";
import { formatDate, formatMoney, formatStatus, t } from "../i18n/localeStore.js";
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
  feedback.value = result.message || (result.unchanged ? t("customerDetail.noChanges") : t("customerDetail.updated"));
  if (result.ok && !result.unchanged) editing.value = false;
}
</script>

<template>
  <template v-if="customer">
  <RouterLink class="back-link" to="/customers">{{ t("customerDetail.back") }}</RouterLink>
  <section class="detail-hero">
    <span class="company-logo large">{{ customer.initials }}</span>
    <div class="customer-main">
      <div class="title-row"><h2>{{ customer.name }}</h2><span class="stage-badge">{{ formatStatus(customer.stage) }}</span></div>
      <p>{{ customer.sector }} · {{ customer.city }}</p>
    </div>
    <div class="detail-actions">
      <button class="secondary-button" @click="startEditing">{{ t("customerDetail.edit") }}</button>
      <button class="secondary-button danger-subtle" @click="salesStore.archiveCustomer(customer.id, !customer.archived)">{{ customer.archived ? t("common.activate") : t("common.archive") }}</button>
      <RouterLink class="primary-button compact link-button" :to="{ name: 'meeting', query: { customer: customer.id } }">{{ t("customerDetail.startMeeting") }}</RouterLink>
    </div>
  </section>
  <section v-if="editing" class="panel customer-edit-panel">
    <div class="panel-header"><div><p class="eyebrow">{{ t("customerDetail.editEyebrow") }}</p><h3>{{ t("customerDetail.editTitle") }}</h3></div><button class="icon-button" :aria-label="t('customerDetail.closeEdit')" @click="editing = false">×</button></div>
    <form class="task-form" @submit.prevent="saveCustomer">
      <div class="form-row"><label><span>{{ t("customers.companyName") }}</span><input v-model="form.name" class="search-input" required /></label><label><span>{{ t("customers.phoneRequired") }}</span><input v-model="form.phone" class="search-input" required /></label></div>
      <div class="form-row"><label><span>{{ t("customers.contact") }}</span><input v-model="form.contact" class="search-input" /></label><label><span>{{ t("customers.role") }}</span><input v-model="form.role" class="search-input" /></label></div>
      <div class="form-row"><label><span>{{ t("common.email") }}</span><input v-model="form.email" class="search-input" type="email" /></label><label><span>{{ t("customers.sector") }}</span><input v-model="form.sector" class="search-input" /></label></div>
      <div class="form-row"><label><span>{{ t("customers.city") }}</span><input v-model="form.city" class="search-input" /></label><label><span>{{ t("customers.stage") }}</span><select v-model="form.stage" class="select-input"><option v-for="stage in stages" :key="stage" :value="stage">{{ formatStatus(stage) }}</option></select></label></div>
      <div class="form-row"><label><span>{{ t("common.ownerStaff") }}</span><OwnerSelect v-model="form.ownerId" /></label><label><span>{{ t("customers.revenue") }}</span><input v-model="form.revenue" class="search-input" /></label></div>
      <label><span>{{ t("customers.score", { score: form.score }) }}</span><input v-model.number="form.score" class="range-input" type="range" min="0" max="100" /></label>
      <button class="primary-button" type="submit">{{ t("customerDetail.save") }}</button>
    </form>
  </section>
  <p v-if="feedback" class="form-feedback customer-detail-feedback" role="status">{{ feedback }}</p>
  <div class="detail-grid">
    <section class="panel">
      <p class="eyebrow">{{ t("customerDetail.contactEyebrow") }}</p><h3>{{ t("customerDetail.contactTitle") }}</h3>
      <dl class="detail-list"><div><dt>{{ t("common.name") }}</dt><dd>{{ customer.contact }}</dd></div><div><dt>{{ t("customers.role") }}</dt><dd>{{ customer.role }}</dd></div><div><dt>{{ t("common.phone") }}</dt><dd>{{ customer.phone }}</dd></div><div><dt>{{ t("common.email") }}</dt><dd>{{ customer.email }}</dd></div><div><dt>{{ t("common.owner") }}</dt><dd>{{ salesStore.userName(customer.ownerId) }}</dd></div></dl>
    </section>
    <section class="panel">
      <p class="eyebrow">{{ t("customerDetail.opportunityEyebrow") }}</p><h3>{{ t("customerDetail.opportunityTitle") }}</h3>
      <div class="score-display"><strong>{{ customer.score }}</strong><span>/100<br />{{ t("customerDetail.scoreLabel") }}</span></div>
      <dl class="detail-list"><div><dt>{{ t("customerDetail.potential") }}</dt><dd>{{ customer.revenue }}</dd></div><div><dt>{{ t("customers.lastContact") }}</dt><dd>{{ formatDate(customer.lastContactDate, { dateStyle: "medium" }) }}</dd></div></dl>
    </section>
    <section class="panel detail-wide">
      <div class="panel-header"><div><p class="eyebrow">{{ t("customerDetail.offersEyebrow") }}</p><h3>{{ t("customerDetail.offersTitle") }}</h3></div><span class="count-badge">{{ customerOffers.length }}</span></div>
      <RouterLink v-for="offer in customerOffers" :key="offer.id" class="offer offer-card-link" :to="`/offers/${offer.id}`"><div class="offer-top"><span>{{ offer.no }}</span><span class="offer-status">{{ formatStatus(offer.status) }}</span></div><h4>{{ offer.title }}</h4><div class="offer-bottom"><strong>{{ formatMoney(offer.numericAmount) }}</strong><small>{{ t("customerDetail.winChance", { value: offer.probability }) }}</small></div></RouterLink>
      <p v-if="!customerOffers.length" class="empty-state">{{ t("customerDetail.noOffers") }}</p>
    </section>
    <section class="panel detail-wide">
      <ActivityTimeline entity-type="customer" :entity-id="customer.id" />
    </section>
  </div>
  </template>
  <section v-else class="panel not-found"><span>404</span><h2>{{ t("customerDetail.missing") }}</h2><RouterLink class="primary-button compact link-button" to="/customers">{{ t("customerDetail.back") }}</RouterLink></section>
</template>
