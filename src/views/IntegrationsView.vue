<script setup>
import { computed, ref } from "vue";
import { formatDate, t } from "../i18n/localeStore.js";
import { salesStore } from "../stores/salesStore";
import { buildInboundUrl, inboundSources } from "../services/inboundLeadService";

const baseUrl = ref(salesStore.state.inboundSettings.baseUrl);
const feedback = ref("");
const copied = ref("");
const testSource = ref("webform");
const testPayload = ref(JSON.stringify({ name: "Test Customer", company: "Example Co", phone: "0530 505 66 48", email: "test@example.com", campaign: "Demo Form" }, null, 2));
const sourceEntries = computed(() => Object.entries(inboundSources).map(([key, definition]) => ({
  key,
  ...definition,
  displayLabel: t(`integrations.inbound.${key}.label`) === `integrations.inbound.${key}.label` ? definition.label : t(`integrations.inbound.${key}.label`),
  displayNote: t(`integrations.inbound.${key}.note`) === `integrations.inbound.${key}.note` ? definition.note : t(`integrations.inbound.${key}.note`),
  config: salesStore.state.inboundSettings.sources[key],
  url: buildInboundUrl(salesStore.state.inboundSettings.baseUrl, salesStore.state.organization.id, key),
})));
const selectedConfig = computed(() => salesStore.state.inboundSettings.sources[testSource.value]);
function saveBaseUrl() { feedback.value = salesStore.setInboundBaseUrl(baseUrl.value) ? t("integrations.saved") : t("integrations.invalidUrl"); }
async function copy(value, key) { await navigator.clipboard.writeText(value); copied.value = key; window.setTimeout(() => { copied.value = ""; }, 1500); }
function runTest() {
  try { feedback.value = salesStore.receiveInboundLead(testSource.value, JSON.parse(testPayload.value), selectedConfig.value.token).message; }
  catch { feedback.value = t("integrations.badJson"); }
}
function sampleCurl(item) { return `curl -X POST "${item.url}" -H "Content-Type: application/json" -H "${item.auth}: ${item.config.token}" -d '{"name":"Ayse Yilmaz","phone":"05305056648","email":"ayse@example.com","campaign":"Demo"}'`; }
</script>

<template>
  <nav class="settings-tabs"><RouterLink to="/settings">{{ t("settings.orgTab") }}</RouterLink><RouterLink to="/integrations">{{ t("settings.apiTab") }}</RouterLink></nav>
  <section class="panel inbound-header"><div><p class="eyebrow">{{ t("integrations.eyebrow") }}</p><h3>{{ t("integrations.title") }}</h3><p>{{ t("integrations.hint") }}</p></div><form @submit.prevent="saveBaseUrl"><label><span>{{ t("integrations.baseUrl") }}</span><input v-model="baseUrl" class="search-input" placeholder="https://api.yourcompany.com/api" /></label><button class="primary-button compact">{{ t("integrations.save") }}</button></form></section>
  <div class="integration-source-grid">
    <article v-for="item in sourceEntries" :key="item.key" class="panel integration-source-card">
      <div class="integration-card-head"><div><p class="eyebrow">{{ item.key.toUpperCase() }}</p><h3>{{ item.displayLabel }}</h3></div><label class="sync-toggle"><input type="checkbox" :checked="item.config.enabled" @change="salesStore.toggleInboundSource(item.key, $event.target.checked)" /><span>{{ item.config.enabled ? t("common.active") : t("common.inactive") }}</span></label></div>
      <p>{{ item.displayNote }}</p>
      <label class="endpoint-field"><span>{{ t("integrations.webhookUrl") }}</span><div><code>{{ item.url }}</code><button @click="copy(item.url, `${item.key}-url`)">{{ copied === `${item.key}-url` ? t("common.copied") : t("common.copy") }}</button></div></label>
      <label class="endpoint-field"><span>{{ t("integrations.auth") }}</span><div><code>{{ item.auth }}: {{ item.config.token }}</code><button @click="copy(item.config.token, `${item.key}-token`)">{{ copied === `${item.key}-token` ? t("common.copied") : t("common.copy") }}</button></div></label>
      <details><summary>{{ t("integrations.curl") }}</summary><pre>{{ sampleCurl(item) }}</pre></details>
      <div class="integration-card-footer"><span>{{ t("integrations.accepted", { count: item.config.received }) }}</span><span>{{ t("integrations.last", { value: item.config.lastReceivedAt ? formatDate(item.config.lastReceivedAt) : t("integrations.never") }) }}</span><button class="text-link" @click="salesStore.rotateInboundToken(item.key)">{{ t("integrations.rotate") }}</button></div>
    </article>
  </div>
  <section class="panel inbound-tester"><div><p class="eyebrow">{{ t("integrations.testEyebrow") }}</p><h3>{{ t("integrations.testTitle") }}</h3><p>{{ t("integrations.testHint") }}</p></div><select v-model="testSource" class="select-input"><option v-for="item in sourceEntries" :key="item.key" :value="item.key">{{ item.displayLabel }}</option></select><textarea v-model="testPayload"></textarea><button class="primary-button compact" @click="runTest">{{ t("integrations.runTest") }}</button></section>
  <section class="panel inbound-log"><div class="panel-header"><div><p class="eyebrow">{{ t("integrations.logEyebrow") }}</p><h3>{{ t("integrations.logTitle") }}</h3></div><span>{{ salesStore.state.inboundSettings.logs.length }}</span></div><div class="sheet-scroll"><table class="report-table"><thead><tr><th>{{ t("integrations.time") }}</th><th>{{ t("integrations.source") }}</th><th>{{ t("common.status") }}</th><th>{{ t("integrations.result") }}</th><th>Lead</th></tr></thead><tbody><tr v-for="log in salesStore.state.inboundSettings.logs.slice(0, 30)" :key="log.id"><td>{{ formatDate(log.receivedAt) }}</td><td>{{ inboundSources[log.sourceKey]?.label }}</td><td><span class="journey-status" :class="log.status === 'accepted' ? 'success' : 'danger'">{{ log.status }}</span></td><td>{{ log.message }}</td><td>{{ log.leadId || t("common.dash") }}</td></tr><tr v-if="!salesStore.state.inboundSettings.logs.length"><td colspan="5" class="empty-state">{{ t("integrations.empty") }}</td></tr></tbody></table></div></section>
  <p v-if="feedback" class="form-feedback" role="status">{{ feedback }}</p>
</template>
