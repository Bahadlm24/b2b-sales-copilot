<script setup>
import { computed, reactive } from "vue";
import { useRoute, useRouter } from "vue-router";
import ActivityTimeline from "../components/ActivityTimeline.vue";
import OwnerSelect from "../components/OwnerSelect.vue";
import { formatDate, formatStatus, t } from "../i18n/localeStore.js";
import { salesStore } from "../stores/salesStore";

const route = useRoute();
const router = useRouter();
const feedback = reactive({ message: "", error: false });
const lead = computed(() => salesStore.state.leads.find((item) => item.id === Number(route.params.id)));
const form = reactive(lead.value ? { ...lead.value } : {});
const statuses = ["Yeni", "İletişime geçildi", "Nitelikli", "Uygun değil"];
function saveLead() {
  if (form.status === "Uygun değil" && !form.disqualificationReason?.trim()) {
    feedback.message = t("leadDetail.reasonRequired");
    feedback.error = true;
    return;
  }
  const ok = salesStore.updateLead(lead.value.id, form);
  feedback.message = ok ? t("leadDetail.updated") : t("leadDetail.failed");
  feedback.error = !ok;
}
function convertLead() {
  const result = salesStore.convertLeadToCustomer(lead.value.id);
  if (!result.ok) {
    feedback.message = result.message;
    feedback.error = true;
    return;
  }
  router.push(`/customers/${result.customer.id}`);
}
</script>

<template>
  <template v-if="lead">
    <RouterLink class="back-link" to="/leads">{{ t("leadDetail.back") }}</RouterLink>
    <section class="detail-hero">
      <span class="company-logo large">{{ (lead.name || "L").split(" ").map((part) => part[0]).slice(0, 2).join("") }}</span>
      <div class="customer-main"><div class="title-row"><h2>{{ lead.name || t("leads.unnamed") }}</h2><span class="stage-badge">{{ formatStatus(lead.status) }}</span></div><p>{{ lead.company || t("leads.noCompany") }} · {{ formatStatus(lead.source) }}</p></div>
      <div class="detail-actions"><span class="score-pill">{{ lead.score }}</span><button class="secondary-button" @click="salesStore.archiveLead(lead.id, !lead.archived)">{{ lead.archived ? t("common.activate") : t("common.archive") }}</button><button v-if="!lead.convertedCustomerId && !lead.archived" class="primary-button compact" @click="convertLead">{{ t("leadDetail.convert") }}</button><RouterLink v-else-if="lead.convertedCustomerId" class="secondary-button link-button" :to="`/customers/${lead.convertedCustomerId}`">{{ t("leadDetail.openCustomer") }}</RouterLink></div>
    </section>
    <div class="detail-grid">
      <section class="panel">
        <p class="eyebrow">{{ t("leadDetail.infoEyebrow") }}</p><h3>{{ t("leadDetail.infoTitle") }}</h3>
        <form class="task-form" @submit.prevent="saveLead">
          <div class="form-row"><label><span>{{ t("common.name") }}</span><input v-model="form.name" class="search-input" /></label><label><span>{{ t("common.company") }}</span><input v-model="form.company" class="search-input" /></label></div>
          <div class="form-row"><label><span>{{ t("common.phone") }}</span><input v-model="form.phone" class="search-input" required /></label><label><span>{{ t("common.email") }}</span><input v-model="form.email" class="search-input" type="email" /></label></div>
          <div class="form-row"><label><span>{{ t("common.status") }}</span><select v-model="form.status" class="select-input"><option v-for="status in statuses" :key="status" :value="status">{{ formatStatus(status) }}</option></select></label><label><span>{{ t("common.owner") }}</span><OwnerSelect v-model="form.ownerId" /></label></div>
          <label><span>{{ t("leads.score", { score: form.score }) }}</span><input v-model="form.score" class="range-input" type="range" min="0" max="100" /></label>
          <label v-if="form.status === 'Uygun değil'"><span>{{ t("leadDetail.reason") }}</span><textarea v-model="form.disqualificationReason" class="compact-textarea" required /></label>
          <button class="primary-button" type="submit">{{ t("leadDetail.save") }}</button>
        </form>
      </section>
      <p v-if="feedback.message" class="form-feedback" :class="{ error: feedback.error }">{{ feedback.message }}</p>
      <section class="panel">
        <p class="eyebrow">{{ t("leadDetail.sourceEyebrow") }}</p><h3>{{ t("leadDetail.sourceTitle") }}</h3>
        <dl class="detail-list"><div><dt>{{ t("leads.source") }}</dt><dd>{{ formatStatus(lead.source) }}</dd></div><div><dt>{{ t("leads.campaign") }}</dt><dd>{{ lead.campaign || t("common.dash") }}</dd></div><div><dt>{{ t("leadDetail.created") }}</dt><dd>{{ formatDate(lead.createdAt) }}</dd></div><div><dt>{{ t("leadDetail.lastSync") }}</dt><dd>{{ lead.lastSyncedAt ? formatDate(lead.lastSyncedAt) : t("common.dash") }}</dd></div></dl>
      </section>
      <section class="panel detail-wide"><ActivityTimeline entity-type="lead" :entity-id="lead.id" /></section>
    </div>
  </template>
  <section v-else class="panel not-found"><span>404</span><h2>{{ t("leadDetail.missing") }}</h2><RouterLink class="primary-button compact link-button" to="/leads">{{ t("leadDetail.back") }}</RouterLink></section>
</template>
