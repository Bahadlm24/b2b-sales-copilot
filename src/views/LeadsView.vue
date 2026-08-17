<script setup>
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import readXlsxFile from "read-excel-file/browser";
import ActivityTimeline from "../components/ActivityTimeline.vue";
import SummaryGrid from "../components/SummaryGrid.vue";
import { dateLocale, formatStatus, t } from "../i18n/localeStore.js";
import { formatPhoneNumber } from "../services/phoneFormatter";
import { prepareLeadImport } from "../services/leadImporter";
import { salesStore } from "../stores/salesStore";

const sources = ["Facebook", "Instagram", "Google Ads", "Web Form", "Manuel"];
const router = useRouter();
const statuses = ["Yeni", "İletişime geçildi", "Nitelikli", "Müşteriye dönüştü", "Uygun değil"];
const sourceFilter = ref("all");
const showArchived = ref(false);
const search = ref("");
const feedback = ref("");
const importRows = ref([]);
const importFileName = ref("");
const importFeedback = ref("");
const isReadingFile = ref(false);
const expandedLeadId = ref(null);
const form = reactive({ name: "", company: "", phone: "", email: "", source: "Web Form", campaign: "", score: 50 });

const filteredLeads = computed(() => salesStore.state.leads.filter((lead) => {
  if (Boolean(lead.archived) !== showArchived.value) return false;
  const matchesSource = sourceFilter.value === "all" || lead.source === sourceFilter.value;
  const query = search.value.toLocaleLowerCase(dateLocale.value);
  const matchesSearch = `${lead.name} ${lead.company} ${lead.email} ${lead.phone}`.toLocaleLowerCase(dateLocale.value).includes(query);
  return matchesSource && matchesSearch;
}));
const newLeadCount = computed(() => salesStore.state.leads.filter((lead) => lead.status === "Yeni").length);
const qualifiedCount = computed(() => salesStore.state.leads.filter((lead) => lead.status === "Nitelikli").length);
const averageScore = computed(() => Math.round(salesStore.state.leads.reduce((sum, lead) => sum + lead.score, 0) / salesStore.state.leads.length || 0));
const summaryItems = computed(() => [
  { label: t("leads.total"), value: salesStore.state.leads.length, hint: t("leads.allSources") },
  { label: t("leads.newQualified"), value: `${newLeadCount.value} / ${qualifiedCount.value}`, hint: t("leads.waiting") },
  { label: t("leads.avgScore"), value: averageScore.value, hint: t("leads.of100") },
]);

function submitLead() {
  const lead = salesStore.addLead({ ...form, name: form.name.trim(), company: form.company.trim() });
  feedback.value = t("leads.added", { name: lead.name });
  Object.assign(form, { name: "", company: "", phone: "", email: "", source: "Web Form", campaign: "", score: 50 });
}

function previewPhone() {
  if (form.phone) form.phone = formatPhoneNumber(form.phone);
}

async function readExcel(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  isReadingFile.value = true;
  importFeedback.value = "";
  try {
    const [headers = [], ...dataRows] = await readXlsxFile(file);
    const rows = dataRows.map((values) => Object.fromEntries(headers.map((header, index) => [String(header ?? ""), values[index] ?? ""])));
    importRows.value = prepareLeadImport(rows, salesStore.state.leads);
    importFileName.value = file.name;
    if (!rows.length) importFeedback.value = t("leads.noRows");
  } catch {
    importRows.value = [];
    importFeedback.value = t("leads.badFile");
  } finally {
    isReadingFile.value = false;
  }
}

function importValidRows() {
  const validRows = importRows.value.filter((row) => row.status === "ready");
  for (const row of validRows) {
    salesStore.addLead({
      name: [row.firstName, row.lastName].filter(Boolean).join(" "),
      company: "",
      phone: row.phone,
      email: row.email,
      source: "Excel",
      campaign: importFileName.value,
      score: 50,
    });
    row.status = "imported";
    row.message = t("importer.imported");
  }
  importFeedback.value = t("leads.importedCount", { count: validRows.length });
}
</script>

<template>
  <SummaryGrid :items="summaryItems" />

  <section class="panel excel-import-panel">
    <div class="panel-header">
      <div><p class="eyebrow">{{ t("leads.importEyebrow") }}</p><h3>{{ t("leads.importTitle") }}</h3></div>
      <label class="file-button"><input type="file" accept=".xlsx" @change="readExcel" />{{ isReadingFile ? t("leads.reading") : t("leads.pickFile") }}</label>
    </div>
    <p class="import-help">{{ t("leads.importHelp") }}</p>
    <div v-if="importRows.length" class="import-preview">
      <div class="import-summary"><span>{{ importFileName }}</span><strong>{{ t("leads.readyDupError", { ready: importRows.filter((row) => row.status === "ready").length, duplicate: importRows.filter((row) => row.status === "duplicate").length, error: importRows.filter((row) => row.status === "error").length }) }}</strong></div>
      <div class="import-table-wrap">
        <table class="import-table">
          <thead><tr><th>{{ t("leads.row") }}</th><th>{{ t("leads.firstName") }}</th><th>{{ t("leads.lastName") }}</th><th>{{ t("common.phone") }}</th><th>{{ t("common.email") }}</th><th>{{ t("integrations.result") }}</th></tr></thead>
          <tbody>
            <tr v-for="row in importRows" :key="row.rowNumber" :class="`import-${row.status}`">
              <td>{{ row.rowNumber }}</td><td>{{ row.firstName || t("common.dash") }}</td><td>{{ row.lastName || t("common.dash") }}</td><td>{{ row.phone || t("common.dash") }}</td><td>{{ row.email || t("common.dash") }}</td><td><strong>{{ row.message }}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
      <button class="primary-button import-button" :disabled="!importRows.some((row) => row.status === 'ready')" @click="importValidRows">{{ t("leads.importAction") }}</button>
    </div>
    <p v-if="importFeedback" class="form-feedback import-feedback" role="status">{{ importFeedback }}</p>
  </section>

  <div class="lead-layout">
    <section class="panel">
      <p class="eyebrow">{{ t("leads.formEyebrow") }}</p><h3>{{ t("leads.formTitle") }}</h3>
      <form class="task-form" @submit.prevent="submitLead">
        <div class="form-row"><label><span>{{ t("common.name") }}</span><input v-model="form.name" class="search-input" required /></label><label><span>{{ t("common.company") }}</span><input v-model="form.company" class="search-input" required /></label></div>
        <div class="form-row"><label><span>{{ t("common.phone") }}</span><input v-model="form.phone" class="search-input" required placeholder="0530 505 66 48" @blur="previewPhone" /></label><label><span>{{ t("common.email") }}</span><input v-model="form.email" class="search-input" type="email" required /></label></div>
        <div class="form-row"><label><span>{{ t("leads.source") }}</span><select v-model="form.source" class="select-input"><option v-for="source in sources" :key="source" :value="source">{{ formatStatus(source) }}</option></select></label><label><span>{{ t("leads.campaign") }}</span><input v-model="form.campaign" class="search-input" :placeholder="t('leads.campaignPh')" /></label></div>
        <label><span>{{ t("leads.score", { score: form.score }) }}</span><input v-model="form.score" class="range-input" type="range" min="0" max="100" /></label>
        <button class="primary-button" type="submit">{{ t("leads.add") }}</button>
        <p v-if="feedback" class="form-feedback" role="status">{{ feedback }}</p>
      </form>
    </section>
    <section class="panel table-panel">
      <div class="list-toolbar lead-toolbar"><div><p class="eyebrow">{{ t("leads.listEyebrow") }}</p><h3>{{ t("leads.listTitle") }}</h3></div><button class="secondary-button" @click="showArchived = !showArchived">{{ showArchived ? t("common.activeRecords") : t("common.archiveNoun") }}</button><input v-model="search" class="search-input" :placeholder="t('leads.search')" /><select v-model="sourceFilter" class="select-input compact-select"><option value="all">{{ t("common.all") }}</option><option v-for="source in sources" :key="source" :value="source">{{ formatStatus(source) }}</option></select></div>
      <div class="lead-list">
        <div v-for="lead in filteredLeads" :key="lead.id" class="lead-record">
          <article class="lead-row clickable-row" @click="router.push(`/leads/${lead.id}`)">
            <span class="source-badge">{{ formatStatus(lead.source) }}</span>
            <div class="row-main"><strong>{{ lead.name || t("leads.unnamed") }}</strong><small>{{ lead.company || t("leads.noCompany") }} · {{ lead.phone }}</small><small>{{ lead.email || t("leads.noEmail") }} · {{ lead.campaign || t("leads.noCampaign") }}</small></div>
            <span class="score-pill">{{ lead.score }}</span>
            <select :value="lead.status" class="select-input lead-status-select" @click.stop @change.stop="salesStore.updateLeadStatus(lead.id, $event.target.value)"><option v-for="status in statuses" :key="status" :value="status">{{ formatStatus(status) }}</option></select>
            <button class="activity-toggle" @click.stop="expandedLeadId = expandedLeadId === lead.id ? null : lead.id">{{ expandedLeadId === lead.id ? t("common.close") : t("leads.activities") }}</button>
          </article>
          <ActivityTimeline v-if="expandedLeadId === lead.id" entity-type="lead" :entity-id="lead.id" compact />
        </div>
        <p v-if="!filteredLeads.length" class="empty-state">{{ t("leads.empty") }}</p>
      </div>
    </section>
  </div>
</template>
