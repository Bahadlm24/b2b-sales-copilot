<script setup>
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { formatPhoneNumber } from "../services/phoneFormatter";
import { prepareLeadImport } from "../services/leadImporter";
import { salesStore } from "../stores/salesStore";
import readXlsxFile from "read-excel-file/browser";
import ActivityTimeline from "../components/ActivityTimeline.vue";

const sources = ["Facebook", "Instagram", "Google Ads", "Web Form", "Manuel"];
const router = useRouter();
const statuses = ["Yeni", "İletişime geçildi", "Nitelikli", "Müşteriye dönüştü", "Uygun değil"];
const sourceFilter = ref("Tümü");
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
  const matchesSource = sourceFilter.value === "Tümü" || lead.source === sourceFilter.value;
  const query = search.value.toLocaleLowerCase("tr-TR");
  const matchesSearch = `${lead.name} ${lead.company} ${lead.email} ${lead.phone}`.toLocaleLowerCase("tr-TR").includes(query);
  return matchesSource && matchesSearch;
}));
const newLeadCount = computed(() => salesStore.state.leads.filter((lead) => lead.status === "Yeni").length);
const qualifiedCount = computed(() => salesStore.state.leads.filter((lead) => lead.status === "Nitelikli").length);
const averageScore = computed(() => Math.round(salesStore.state.leads.reduce((sum, lead) => sum + lead.score, 0) / salesStore.state.leads.length || 0));

function submitLead() {
  const lead = salesStore.addLead({ ...form, name: form.name.trim(), company: form.company.trim() });
  feedback.value = `${lead.name} potansiyel müşteri havuzuna eklendi.`;
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
    if (!rows.length) importFeedback.value = "Dosyada aktarılabilir satır bulunamadı.";
  } catch {
    importRows.value = [];
    importFeedback.value = "Dosya okunamadı. Geçerli bir .xlsx Excel dosyası seçin.";
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
    row.message = "İçe aktarıldı";
  }
  importFeedback.value = `${validRows.length} kayıt içe aktarıldı; hatalı ve mükerrer satırlar atlandı.`;
}
</script>

<template>
  <section class="summary-grid">
    <article class="summary-card"><small>TOPLAM LEAD</small><strong>{{ salesStore.state.leads.length }}</strong><span>Tüm reklam kaynakları</span></article>
    <article class="summary-card"><small>YENİ / NİTELİKLİ</small><strong>{{ newLeadCount }} / {{ qualifiedCount }}</strong><span>Takip bekleyen potansiyel</span></article>
    <article class="summary-card"><small>ORTALAMA SKOR</small><strong>{{ averageScore }}</strong><span>100 üzerinden</span></article>
  </section>

  <section class="panel excel-import-panel">
    <div class="panel-header">
      <div><p class="eyebrow">TOPLU VERİ AKTARIMI</p><h3>Excel dosyasından lead yükle</h3></div>
      <label class="file-button"><input type="file" accept=".xlsx" @change="readExcel" />{{ isReadingFile ? "Dosya okunuyor..." : ".xlsx dosyası seç" }}</label>
    </div>
    <p class="import-help">Sütunlar: <strong>ad, soyad, telefon, mail</strong>. Yalnızca telefon zorunludur. Mükerrer telefonlar aktarılmaz.</p>
    <div v-if="importRows.length" class="import-preview">
      <div class="import-summary"><span>{{ importFileName }}</span><strong>{{ importRows.filter((row) => row.status === "ready").length }} hazır · {{ importRows.filter((row) => row.status === "duplicate").length }} mükerrer · {{ importRows.filter((row) => row.status === "error").length }} hatalı</strong></div>
      <div class="import-table-wrap">
        <table class="import-table">
          <thead><tr><th>Satır</th><th>Ad</th><th>Soyad</th><th>Telefon</th><th>Mail</th><th>Sonuç</th></tr></thead>
          <tbody>
            <tr v-for="row in importRows" :key="row.rowNumber" :class="`import-${row.status}`">
              <td>{{ row.rowNumber }}</td><td>{{ row.firstName || "—" }}</td><td>{{ row.lastName || "—" }}</td><td>{{ row.phone || "—" }}</td><td>{{ row.email || "—" }}</td><td><strong>{{ row.message }}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
      <button class="primary-button import-button" :disabled="!importRows.some((row) => row.status === 'ready')" @click="importValidRows">Geçerli kayıtları içe aktar</button>
    </div>
    <p v-if="importFeedback" class="form-feedback import-feedback" role="status">{{ importFeedback }}</p>
  </section>

  <div class="lead-layout">
    <section class="panel">
      <p class="eyebrow">WEBFORM / MANUEL GİRİŞ</p><h3>Potansiyel müşteri ekle</h3>
      <form class="task-form" @submit.prevent="submitLead">
        <div class="form-row"><label><span>Ad soyad</span><input v-model="form.name" class="search-input" required /></label><label><span>Firma</span><input v-model="form.company" class="search-input" required /></label></div>
        <div class="form-row"><label><span>Telefon</span><input v-model="form.phone" class="search-input" required placeholder="0530 505 66 48" @blur="previewPhone" /></label><label><span>E-posta</span><input v-model="form.email" class="search-input" type="email" required /></label></div>
        <div class="form-row"><label><span>Kaynak</span><select v-model="form.source" class="select-input"><option v-for="source in sources" :key="source">{{ source }}</option></select></label><label><span>Kampanya</span><input v-model="form.campaign" class="search-input" placeholder="Örn. Yaz Demo Formu" /></label></div>
        <label><span>İlk lead skoru: {{ form.score }}</span><input v-model="form.score" class="range-input" type="range" min="0" max="100" /></label>
        <button class="primary-button" type="submit">Lead havuzuna ekle</button>
        <p v-if="feedback" class="form-feedback" role="status">{{ feedback }}</p>
      </form>
    </section>
    <section class="panel table-panel">
      <div class="list-toolbar lead-toolbar"><div><p class="eyebrow">POTANSİYEL MÜŞTERİLER</p><h3>Gelen lead havuzu</h3></div><button class="secondary-button" @click="showArchived = !showArchived">{{ showArchived ? "Aktif kayıtlar" : "Arşiv" }}</button><input v-model="search" class="search-input" placeholder="Lead ara..." /><select v-model="sourceFilter" class="select-input compact-select"><option>Tümü</option><option v-for="source in sources" :key="source">{{ source }}</option></select></div>
      <div class="lead-list">
        <div v-for="lead in filteredLeads" :key="lead.id" class="lead-record">
          <article class="lead-row clickable-row" @click="router.push(`/leads/${lead.id}`)">
            <span class="source-badge">{{ lead.source }}</span>
            <div class="row-main"><strong>{{ lead.name || "İsimsiz lead" }}</strong><small>{{ lead.company || "Firma belirtilmedi" }} · {{ lead.phone }}</small><small>{{ lead.email || "E-posta belirtilmedi" }} · {{ lead.campaign || "Kampanya yok" }}</small></div>
            <span class="score-pill">{{ lead.score }}</span>
            <select :value="lead.status" class="select-input lead-status-select" @click.stop @change.stop="salesStore.updateLeadStatus(lead.id, $event.target.value)"><option v-for="status in statuses" :key="status">{{ status }}</option></select>
            <button class="activity-toggle" @click.stop="expandedLeadId = expandedLeadId === lead.id ? null : lead.id">{{ expandedLeadId === lead.id ? "Kapat" : "Aktiviteler" }}</button>
          </article>
          <ActivityTimeline v-if="expandedLeadId === lead.id" entity-type="lead" :entity-id="lead.id" compact />
        </div>
        <p v-if="!filteredLeads.length" class="empty-state">Filtreye uygun lead bulunamadı.</p>
      </div>
    </section>
  </div>
</template>
