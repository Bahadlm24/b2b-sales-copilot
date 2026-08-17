<script setup>
import { computed, ref } from "vue";
import SummaryGrid from "../components/SummaryGrid.vue";
import { salesStore } from "../stores/salesStore";

const tab = ref("audit");
const search = ref("");
const status = ref("Tümü");
const expandedActor = ref(null);
const filteredLogs = computed(() => salesStore.state.auditLogs.filter((log) => {
  const query = search.value.toLocaleLowerCase("tr-TR");
  const matchesSearch = `${log.actor.name} ${log.action} ${log.resource}`.toLocaleLowerCase("tr-TR").includes(query);
  const matchesStatus = status.value === "Tümü" || log.status === status.value;
  return matchesSearch && matchesStatus;
}));
const groupedLogs = computed(() => {
  const groups = new Map();
  for (const log of filteredLogs.value) {
    const key = log.actor.id ?? `name:${log.actor.name}`;
    if (!groups.has(key)) groups.set(key, { key, actor: log.actor, logs: [], failures: 0, lastSeen: log.timestamp });
    const group = groups.get(key);
    group.logs.push(log);
    if (log.status === "failed") group.failures += 1;
    if (new Date(log.timestamp) > new Date(group.lastSeen)) group.lastSeen = log.timestamp;
  }
  return [...groups.values()].sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));
});

function downloadJson(fileName, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <SummaryGrid :items="[
    { label: 'TOPLAM AUDIT KAYDI', value: salesStore.state.auditLogs.length, hint: 'Son 2.000 işlem saklanır' },
    { label: 'BAŞARISIZ İŞLEM', value: salesStore.state.auditLogs.filter((log) => log.status === 'failed').length, hint: 'Giriş ve işlem hataları' },
    { label: 'MAIL LOG', value: salesStore.state.mailOutbox.length, hint: 'Kuyruğa alınan mesajlar' },
  ]" />

  <section class="panel table-panel">
    <div class="audit-tabs">
      <button :class="{ active: tab === 'audit' }" @click="tab = 'audit'">Audit History</button>
      <button :class="{ active: tab === 'mail' }" @click="tab = 'mail'">Mail Log</button>
    </div>
    <template v-if="tab === 'audit'">
      <div class="list-toolbar audit-toolbar">
        <div><p class="eyebrow">İŞLEM KAYITLARI</p><h3>Kim, neyi, ne zaman yaptı?</h3></div>
        <input v-model="search" class="search-input" placeholder="Kişi veya işlem ara..." />
        <select v-model="status" class="select-input compact-select"><option>Tümü</option><option value="success">Başarılı</option><option value="failed">Başarısız</option></select>
        <button class="secondary-button" @click="downloadJson('audit-history.json', salesStore.state.auditLogs)">JSON indir</button>
      </div>
      <div class="audit-groups">
        <article v-for="group in groupedLogs" :key="group.key" class="audit-group">
          <button class="audit-group-head" @click="expandedActor = expandedActor === group.key ? null : group.key">
            <span class="avatar">{{ group.actor.name.split(' ').map((part) => part[0]).slice(0, 2).join('') }}</span>
            <span><strong>{{ group.actor.name }}</strong><small>Son hareket: {{ new Date(group.lastSeen).toLocaleString('tr-TR') }}</small></span>
            <span><strong>{{ group.logs.length }}</strong><small>Toplam hareket</small></span>
            <span><strong>{{ group.failures }}</strong><small>Başarısız</small></span>
            <span>{{ expandedActor === group.key ? "Kapat ↑" : "Hareketleri gör ↓" }}</span>
          </button>
          <div v-if="expandedActor === group.key" class="audit-list">
            <div v-for="log in group.logs" :key="log.id" class="audit-row">
              <span class="audit-status" :class="log.status"></span>
              <div><strong>{{ new Date(log.timestamp).toLocaleString('tr-TR') }}</strong><small>{{ log.actor.name }}</small></div>
              <code>{{ log.action }}</code>
              <span>{{ log.resource }}<small v-if="log.resourceId">#{{ log.resourceId }}</small></span>
              <span class="audit-ip">{{ log.ipAddress || "Eski kayıt" }}<small>IP adresi</small></span>
              <span class="audit-response" :class="{ failed: (log.response?.statusCode || 200) >= 400 }"><strong>{{ log.response?.statusCode || "—" }}</strong><small>{{ log.response?.message || "Response bilgisi yok" }}</small></span>
              <details><summary>Detay</summary><pre>{{ JSON.stringify(log.details, null, 2) }}</pre></details>
            </div>
          </div>
        </article>
        <p v-if="!groupedLogs.length" class="empty-state">Filtreye uygun audit kaydı bulunamadı.</p>
      </div>
    </template>
    <template v-else>
      <div class="list-toolbar"><div><p class="eyebrow">E-POSTA KAYITLARI</p><h3>Mail gönderim geçmişi</h3></div><button class="secondary-button" @click="downloadJson('mail.log.json', salesStore.state.mailOutbox)">mail.log.json indir</button></div>
      <div class="mail-log-list">
        <article v-for="mail in salesStore.state.mailOutbox" :key="mail.id">
          <div><strong>{{ mail.subject }}</strong><small>{{ new Date(mail.createdAt).toLocaleString('tr-TR') }}</small></div>
          <span>{{ mail.to }}</span><p>{{ mail.message }}</p>
        </article>
        <p v-if="!salesStore.state.mailOutbox.length" class="empty-state">Henüz mail kaydı bulunmuyor.</p>
      </div>
    </template>
  </section>
</template>
