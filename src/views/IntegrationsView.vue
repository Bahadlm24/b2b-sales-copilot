<script setup>
import { computed, reactive, ref } from "vue";
import { salesStore } from "../stores/salesStore";
import { buildInboundUrl, inboundSources } from "../services/inboundLeadService";

const baseUrl = ref(salesStore.state.inboundSettings.baseUrl);
const feedback = ref("");
const copied = ref("");
const testSource = ref("webform");
const testPayload = ref(JSON.stringify({ name: "Test Müşteri", company: "Örnek Firma", phone: "0530 505 66 48", email: "test@example.com", campaign: "Demo Formu" }, null, 2));
const sourceEntries = computed(() => Object.entries(inboundSources).map(([key, definition]) => ({ key, ...definition, config: salesStore.state.inboundSettings.sources[key], url: buildInboundUrl(salesStore.state.inboundSettings.baseUrl, salesStore.state.organization.id, key) })));
const selectedConfig = computed(() => salesStore.state.inboundSettings.sources[testSource.value]);
function saveBaseUrl() { feedback.value = salesStore.setInboundBaseUrl(baseUrl.value) ? "API temel adresi kaydedildi." : "Geçerli bir http/https adresi girin."; }
async function copy(value, key) { await navigator.clipboard.writeText(value); copied.value = key; window.setTimeout(() => { copied.value = ""; }, 1500); }
function runTest() {
  try { feedback.value = salesStore.receiveInboundLead(testSource.value, JSON.parse(testPayload.value), selectedConfig.value.token).message; }
  catch { feedback.value = "Test JSON içeriği geçerli değil."; }
}
function sampleCurl(item) { return `curl -X POST "${item.url}" -H "Content-Type: application/json" -H "${item.auth}: ${item.config.token}" -d '{"name":"Ayşe Yılmaz","phone":"05305056648","email":"ayse@example.com","campaign":"Demo"}'`; }
</script>

<template>
  <section class="panel inbound-header"><div><p class="eyebrow">GELEN DATA BAĞLANTILARI</p><h3>Webhook ve Web Form API adresleri</h3><p>Reklam mecraları bu adreslere sunucudan <code>POST</code> gönderir. URL kullanıcıların tarayıcıda açacağı bir sayfa değildir.</p></div><form @submit.prevent="saveBaseUrl"><label><span>Public API temel adresi</span><input v-model="baseUrl" class="search-input" placeholder="https://api.firmaniz.com/api" /></label><button class="primary-button compact">Kaydet</button></form></section>
  <div class="integration-source-grid">
    <article v-for="item in sourceEntries" :key="item.key" class="panel integration-source-card">
      <div class="integration-card-head"><div><p class="eyebrow">{{ item.key.toUpperCase() }}</p><h3>{{ item.label }}</h3></div><label class="sync-toggle"><input type="checkbox" :checked="item.config.enabled" @change="salesStore.toggleInboundSource(item.key, $event.target.checked)" /><span>{{ item.config.enabled ? 'Aktif' : 'Pasif' }}</span></label></div>
      <p>{{ item.note }}</p>
      <label class="endpoint-field"><span>Webhook URL</span><div><code>{{ item.url }}</code><button @click="copy(item.url, `${item.key}-url`)">{{ copied === `${item.key}-url` ? 'Kopyalandı' : 'Kopyala' }}</button></div></label>
      <label class="endpoint-field"><span>Doğrulama başlığı ve anahtarı</span><div><code>{{ item.auth }}: {{ item.config.token }}</code><button @click="copy(item.config.token, `${item.key}-token`)">{{ copied === `${item.key}-token` ? 'Kopyalandı' : 'Kopyala' }}</button></div></label>
      <details><summary>Örnek cURL isteği</summary><pre>{{ sampleCurl(item) }}</pre></details>
      <div class="integration-card-footer"><span><strong>{{ item.config.received }}</strong> kabul edilen data</span><span>Son: {{ item.config.lastReceivedAt ? new Date(item.config.lastReceivedAt).toLocaleString('tr-TR') : 'Henüz yok' }}</span><button class="text-link" @click="salesStore.rotateInboundToken(item.key)">Anahtarı yenile</button></div>
    </article>
  </div>
  <section class="panel inbound-tester"><div><p class="eyebrow">YEREL WEBHOOK TESTİ</p><h3>Örnek data gönder</h3><p>Bu test ağ isteği yapmadan canlı endpoint’in doğrulama, normalizasyon ve mükerrer kontrol akışını çalıştırır.</p></div><select v-model="testSource" class="select-input"><option v-for="item in sourceEntries" :key="item.key" :value="item.key">{{ item.label }}</option></select><textarea v-model="testPayload"></textarea><button class="primary-button compact" @click="runTest">Test datasını içeri al</button></section>
  <section class="panel inbound-log"><div class="panel-header"><div><p class="eyebrow">TESLİMAT KAYITLARI</p><h3>Son webhook istekleri</h3></div><span>{{ salesStore.state.inboundSettings.logs.length }}</span></div><div class="sheet-scroll"><table class="report-table"><thead><tr><th>Zaman</th><th>Kaynak</th><th>Durum</th><th>Sonuç</th><th>Lead</th></tr></thead><tbody><tr v-for="log in salesStore.state.inboundSettings.logs.slice(0, 30)" :key="log.id"><td>{{ new Date(log.receivedAt).toLocaleString('tr-TR') }}</td><td>{{ inboundSources[log.sourceKey]?.label }}</td><td><span class="journey-status" :class="log.status === 'accepted' ? 'success' : 'danger'">{{ log.status }}</span></td><td>{{ log.message }}</td><td>{{ log.leadId || '—' }}</td></tr><tr v-if="!salesStore.state.inboundSettings.logs.length"><td colspan="5" class="empty-state">Henüz webhook isteği yok.</td></tr></tbody></table></div></section>
  <p v-if="feedback" class="form-feedback" role="status">{{ feedback }}</p>
</template>
