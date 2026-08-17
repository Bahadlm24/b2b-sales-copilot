<script setup>
import { computed, ref } from "vue";
import SummaryGrid from "../components/SummaryGrid.vue";
import { dateLocale, formatDate, t } from "../i18n/localeStore.js";
import { salesStore } from "../stores/salesStore";

const personnelPerformance = computed(() => salesStore.state.users.filter((user) => user.active).map((user) => {
  const leads = salesStore.state.leads.filter((lead) => lead.ownerId === user.id && !lead.archived);
  const responses = leads.filter((lead) => lead.status !== "Yeni").length;
  const wonOffers = salesStore.state.offers.filter((offer) => offer.ownerId === user.id && offer.status === "Kazanıldı" && !offer.archived);
  return {
    name: user.name,
    initials: user.name.split(" ").map((part) => part[0]).slice(0, 2).join(""),
    salesAmount: wonOffers.reduce((sum, offer) => sum + offer.numericAmount, 0),
    closedDeals: wonOffers.length,
    leads: leads.length,
    responses,
  };
}));
const maxSales = computed(() => Math.max(1, ...personnelPerformance.value.map((person) => person.salesAmount)));
const totalSales = computed(() => personnelPerformance.value.reduce((sum, person) => sum + person.salesAmount, 0));
const averageResponseRate = computed(() => Math.round(personnelPerformance.value.reduce((sum, person) => sum + (person.leads ? person.responses / person.leads * 100 : 0), 0) / personnelPerformance.value.length || 0));
const averageScore = computed(() => Math.round(salesStore.customers.filter((item) => !item.archived).reduce((sum, item) => sum + item.score, 0) / salesStore.customers.filter((item) => !item.archived).length || 0));
const wonOffers = computed(() => salesStore.state.offers.filter((offer) => offer.status === "Kazanıldı" && !offer.archived));
const objectionStats = computed(() => {
  const counts = {};
  salesStore.state.meetings.flatMap((meeting) => meeting.insights || []).forEach((item) => { counts[item.id] = (counts[item.id] || 0) + 1; });
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0) || 1;
  return Object.entries(counts).map(([id, value], index) => ({ label: t(`analytics.objections.${id}`) === `analytics.objections.${id}` ? id : t(`analytics.objections.${id}`), value: Math.round(value / total * 100), color: ["#f3b64c", "#5f9c83", "#6897b6", "#a08cbe"][index % 4] })).slice(0, 6);
});
const currency = computed(() => new Intl.NumberFormat(dateLocale.value, { style: "currency", currency: "TRY", notation: "compact", maximumFractionDigits: 1 }));
const expandedPerson = ref(null);
const summaryItems = computed(() => [
  { label: t("analytics.analyzed"), value: salesStore.state.meetings.length, hint: t("analytics.localMeetings") },
  { label: t("analytics.avgScore"), value: averageScore.value, hint: t("customers.activeCustomers") },
  { label: t("analytics.closed"), value: wonOffers.value.length, hint: currency.value.format(salesStore.wonRevenue.value) },
]);
const growthMetrics = computed(() => [
  { value: 84, label: t("analytics.discovery") },
  { value: 76, label: t("analytics.objectionMgmt") },
  { value: 68, label: t("analytics.closeQuestions") },
  { value: 91, label: t("analytics.productKnowledge") },
]);
function relatedUser(name) {
  return salesStore.state.users.find((user) => user.name === name);
}
function personLogs(name) {
  return salesStore.state.auditLogs.filter((log) => log.actor.name === name).slice(0, 8);
}
</script>

<template>
  <SummaryGrid :items="summaryItems" />
  <div class="analytics-grid">
    <section class="panel detail-wide">
      <div class="panel-header"><div><p class="eyebrow">{{ t("analytics.staffEyebrow") }}</p><h3>{{ t("analytics.staffTitle") }}</h3></div><span class="analytics-total">{{ t("analytics.totalHint", { amount: currency.format(totalSales), rate: averageResponseRate }) }}</span></div>
      <div class="performance-chart" role="img" :aria-label="t('analytics.chartLabel')">
        <div v-for="person in personnelPerformance" :key="person.name" class="performance-record">
          <article class="performance-row clickable-row" @click="expandedPerson = expandedPerson === person.name ? null : person.name">
            <div class="person-cell"><span class="avatar">{{ person.initials }}</span><span><strong>{{ person.name }}</strong><small>{{ t("analytics.closedDeals", { count: person.closedDeals }) }}</small></span></div>
            <div class="chart-cell"><div class="chart-label"><span>{{ t("analytics.sales") }}</span><strong>{{ currency.format(person.salesAmount) }}</strong></div><i class="sales-bar"><b :style="{ width: `${person.salesAmount / maxSales * 100}%` }"></b></i></div>
            <div class="response-cell"><strong>%{{ person.leads ? Math.round(person.responses / person.leads * 100) : 0 }}</strong><span>{{ t("analytics.conversion") }}</span><small>{{ t("analytics.replies", { responses: person.responses, leads: person.leads }) }}</small></div>
          </article>
          <div v-if="expandedPerson === person.name" class="person-drilldown">
            <div class="person-kpis"><span><strong>{{ person.leads }}</strong> {{ t("nav.leads") }}</span><span><strong>{{ person.responses }}</strong> {{ t("reports.colResponse") }}</span><span><strong>{{ person.closedDeals }}</strong> {{ t("analytics.sales") }}</span></div>
            <div><h4>{{ t("analytics.lastMoves") }}</h4><p v-for="log in personLogs(person.name)" :key="log.id"><code>{{ log.action }}</code> · {{ formatDate(log.timestamp) }}</p><p v-if="!personLogs(person.name).length">{{ t("analytics.noMoves") }}</p></div>
            <button v-if="relatedUser(person.name) && salesStore.can('users')" class="status-button" :class="{ inactive: !relatedUser(person.name).active }" @click.stop="salesStore.toggleUserStatus(relatedUser(person.name).id)">{{ relatedUser(person.name).active ? t("analytics.deactivate") : t("analytics.activate") }}</button>
          </div>
        </div>
      </div>
    </section>
    <section class="panel">
      <p class="eyebrow">{{ t("analytics.objectionEyebrow") }}</p><h3>{{ t("analytics.objectionTitle") }}</h3>
      <div class="bar-list">
        <div v-for="item in objectionStats" :key="item.label" class="bar-item">
          <div><span>{{ item.label }}</span><strong>%{{ item.value }}</strong></div>
          <i><b :style="{ width: `${item.value * 2.2}%`, background: item.color }"></b></i>
        </div>
      </div>
      <p v-if="!objectionStats.length" class="empty-state">{{ t("analytics.emptyObjections") }}</p>
    </section>
    <section class="panel">
      <p class="eyebrow">{{ t("analytics.coachEyebrow") }}</p><h3>{{ t("analytics.coachTitle") }}</h3>
      <div class="coach-note"><span>01</span><p><strong>{{ t("analytics.coach1Title") }}</strong>{{ t("analytics.coach1") }}</p></div>
      <div class="coach-note"><span>02</span><p><strong>{{ t("analytics.coach2Title") }}</strong>{{ t("analytics.coach2") }}</p></div>
      <div class="coach-note"><span>03</span><p><strong>{{ t("analytics.coach3Title") }}</strong>{{ t("analytics.coach3") }}</p></div>
    </section>
    <section class="panel detail-wide">
      <p class="eyebrow">{{ t("analytics.growthEyebrow") }}</p><h3>{{ t("analytics.growthTitle") }}</h3>
      <div class="metric-grid circular-metrics"><div v-for="metric in growthMetrics" :key="metric.label"><i :style="{ '--metric': metric.value }"><strong>%{{ metric.value }}</strong></i><span>{{ metric.label }}</span></div></div>
    </section>
  </div>
</template>
