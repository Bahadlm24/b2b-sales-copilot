<script setup>
import { computed, reactive, ref } from "vue";
import { dateLocale, formatDate, t } from "../i18n/localeStore.js";
import SummaryGrid from "../components/SummaryGrid.vue";
import { salesStore } from "../stores/salesStore";

const tab = ref("audit");
const search = ref("");
const status = ref("all");
const expandedActor = ref(null);
const filteredLogs = computed(() => salesStore.state.auditLogs.filter((log) => {
  const query = search.value.toLocaleLowerCase(dateLocale.value);
  const matchesSearch = `${log.actor.name} ${log.action} ${log.resource}`.toLocaleLowerCase(dateLocale.value).includes(query);
  const matchesStatus = status.value === "all" || log.status === status.value;
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
const summaryItems = computed(() => [
  { label: t("audit.total"), value: salesStore.state.auditLogs.length, hint: t("audit.retained") },
  { label: t("audit.failed"), value: salesStore.state.auditLogs.filter((log) => log.status === "failed").length, hint: t("audit.failedHint") },
  { label: t("audit.mail"), value: salesStore.state.mailOutbox.length, hint: t("audit.queued") },
]);

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
  <SummaryGrid :items="summaryItems" />

  <section class="panel table-panel">
    <div class="audit-tabs">
      <button :class="{ active: tab === 'audit' }" @click="tab = 'audit'">{{ t("audit.historyTab") }}</button>
      <button :class="{ active: tab === 'mail' }" @click="tab = 'mail'">{{ t("audit.mailTab") }}</button>
    </div>
    <template v-if="tab === 'audit'">
      <div class="list-toolbar audit-toolbar">
        <div><p class="eyebrow">{{ t("audit.logsEyebrow") }}</p><h3>{{ t("audit.logsTitle") }}</h3></div>
        <input v-model="search" class="search-input" :placeholder="t('audit.search')" />
        <select v-model="status" class="select-input compact-select"><option value="all">{{ t("common.all") }}</option><option value="success">{{ t("audit.success") }}</option><option value="failed">{{ t("audit.failedStatus") }}</option></select>
        <button class="secondary-button" @click="downloadJson('audit-history.json', salesStore.state.auditLogs)">{{ t("audit.download") }}</button>
      </div>
      <div class="audit-groups">
        <article v-for="group in groupedLogs" :key="group.key" class="audit-group">
          <button class="audit-group-head" @click="expandedActor = expandedActor === group.key ? null : group.key">
            <span class="avatar">{{ group.actor.name.split(' ').map((part) => part[0]).slice(0, 2).join('') }}</span>
            <span><strong>{{ group.actor.name }}</strong><small>{{ t("audit.lastMove", { date: formatDate(group.lastSeen) }) }}</small></span>
            <span><strong>{{ group.logs.length }}</strong><small>{{ t("audit.totalMoves") }}</small></span>
            <span><strong>{{ group.failures }}</strong><small>{{ t("audit.failedMoves") }}</small></span>
            <span>{{ expandedActor === group.key ? t("audit.hideMoves") : t("audit.showMoves") }}</span>
          </button>
          <div v-if="expandedActor === group.key" class="audit-list">
            <div v-for="log in group.logs" :key="log.id" class="audit-row">
              <span class="audit-status" :class="log.status"></span>
              <div><strong>{{ formatDate(log.timestamp) }}</strong><small>{{ log.actor.name }}</small></div>
              <code>{{ log.action }}</code>
              <span>{{ log.resource }}<small v-if="log.resourceId">#{{ log.resourceId }}</small></span>
              <span class="audit-ip">{{ log.ipAddress || t("audit.oldRecord") }}<small>{{ t("audit.ip") }}</small></span>
              <span class="audit-response" :class="{ failed: (log.response?.statusCode || 200) >= 400 }"><strong>{{ log.response?.statusCode || t("common.dash") }}</strong><small>{{ log.response?.message || t("audit.noResponse") }}</small></span>
              <details><summary>{{ t("common.details") }}</summary><pre>{{ JSON.stringify(log.details, null, 2) }}</pre></details>
            </div>
          </div>
        </article>
        <p v-if="!groupedLogs.length" class="empty-state">{{ t("audit.empty") }}</p>
      </div>
    </template>
    <template v-else>
      <div class="list-toolbar"><div><p class="eyebrow">{{ t("audit.mailEyebrow") }}</p><h3>{{ t("audit.mailTitle") }}</h3></div><button class="secondary-button" @click="downloadJson('mail.log.json', salesStore.state.mailOutbox)">{{ t("audit.downloadMail") }}</button></div>
      <div class="mail-log-list">
        <article v-for="mail in salesStore.state.mailOutbox" :key="mail.id">
          <div><strong>{{ mail.subject }}</strong><small>{{ formatDate(mail.createdAt) }}</small></div>
          <span>{{ mail.to }}</span><p>{{ mail.message }}</p>
        </article>
        <p v-if="!salesStore.state.mailOutbox.length" class="empty-state">{{ t("audit.noMail") }}</p>
      </div>
    </template>
  </section>
</template>
