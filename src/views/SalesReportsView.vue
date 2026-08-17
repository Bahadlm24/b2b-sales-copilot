<script setup>
import { computed, reactive } from "vue";
import { dateLocale, t } from "../i18n/localeStore.js";
import { salesStore } from "../stores/salesStore";
import { buildSalesReport } from "../services/salesReporting";

const filters = reactive({ from: "", to: "", ownerId: "all", source: "all" });
const report = computed(() => buildSalesReport(salesStore.state, filters));
const sources = computed(() => [...new Set(salesStore.state.leads.map((item) => item.source))]);
const currency = computed(() => new Intl.NumberFormat(dateLocale.value, { style: "currency", currency: "TRY", maximumFractionDigits: 0 }));
const maxFunnel = computed(() => Math.max(1, ...report.value.funnel.map((item) => item.value)));
const maxPersonnelRevenue = computed(() => Math.max(1, ...report.value.personnel.map((item) => item.revenue)));
function resetFilters() { Object.assign(filters, { from: "", to: "", ownerId: "all", source: "all" }); }
function funnelLabel(item) {
  return item.key ? t(`reports.funnel.${item.key}`) : item.label;
}
</script>

<template>
  <section class="panel report-filters"><div><p class="eyebrow">{{ t("reports.filtersEyebrow") }}</p><h3>{{ t("reports.filtersTitle") }}</h3></div><label><span>{{ t("reports.from") }}</span><input v-model="filters.from" class="search-input" type="date" /></label><label><span>{{ t("reports.to") }}</span><input v-model="filters.to" class="search-input" type="date" /></label><label><span>{{ t("reports.staff") }}</span><select v-model="filters.ownerId" class="select-input"><option value="all">{{ t("reports.allStaff") }}</option><option v-for="user in salesStore.state.users" :key="user.id" :value="user.id">{{ user.name }}</option></select></label><label><span>{{ t("reports.source") }}</span><select v-model="filters.source" class="select-input"><option value="all">{{ t("reports.allSources") }}</option><option v-for="source in sources" :key="source" :value="source">{{ source }}</option></select></label><button class="secondary-button" @click="resetFilters">{{ t("reports.clear") }}</button></section>

  <section class="report-kpis">
    <article><small>{{ t("reports.totalData") }}</small><strong>{{ report.totals.leads }}</strong><span>{{ t("reports.activePassive", { active: report.totals.active, passive: report.totals.passive }) }}</span></article>
    <article><small>{{ t("reports.responded") }}</small><strong>%{{ report.totals.responseRate }}</strong><span>{{ t("reports.respondedHint", { count: report.totals.responded }) }}</span></article>
    <article><small>{{ t("reports.converted") }}</small><strong>{{ report.totals.converted }}</strong><span>{{ t("reports.conversionHint", { rate: report.totals.conversionRate }) }}</span></article>
    <article><small>{{ t("reports.won") }}</small><strong>{{ report.totals.wonDeals }}</strong><span>{{ t("reports.winHint", { rate: report.totals.winRate }) }}</span></article>
    <article class="revenue-kpi"><small>{{ t("reports.revenue") }}</small><strong>{{ currency.format(report.totals.revenue) }}</strong><span>{{ t("reports.pipeline", { amount: currency.format(report.totals.pipeline) }) }}</span></article>
    <article><small>{{ t("reports.quality") }}</small><strong>{{ report.totals.averageMeetingScore || t("common.dash") }}</strong><span>{{ t("reports.meetingsHint", { count: report.totals.meetings }) }}</span></article>
  </section>

  <div class="report-grid">
    <section class="panel"><div class="panel-header"><div><p class="eyebrow">{{ t("reports.funnelEyebrow") }}</p><h3>{{ t("reports.funnelTitle") }}</h3></div></div><div class="funnel-chart"><article v-for="item in report.funnel" :key="item.key || item.label"><div><span>{{ funnelLabel(item) }}</span><strong>{{ item.value }}</strong></div><i><b :style="{ width: `${item.value / maxFunnel * 100}%` }"></b></i></article></div></section>
    <section class="panel"><div class="panel-header"><div><p class="eyebrow">{{ t("reports.statusEyebrow") }}</p><h3>{{ t("reports.statusTitle") }}</h3></div></div><div class="status-distribution"><article><strong>{{ report.totals.active }}</strong><span>{{ t("reports.activeFollow") }}</span></article><article><strong>{{ report.totals.passive }}</strong><span>{{ t("reports.passive") }}</span></article><article><strong>{{ report.totals.uninterested }}</strong><span>{{ t("reports.uninterested") }}</span></article><article><strong>{{ report.totals.positive }}</strong><span>{{ t("reports.positive") }}</span></article><article><strong>{{ report.totals.negative }}</strong><span>{{ t("reports.negative") }}</span></article><article><strong>{{ report.totals.customers }}</strong><span>{{ t("reports.activeCustomer") }}</span></article></div></section>
    <section class="panel report-wide"><div class="panel-header"><div><p class="eyebrow">{{ t("reports.personnelEyebrow") }}</p><h3>{{ t("reports.personnelTitle") }}</h3></div></div><div class="sheet-scroll"><table class="report-table"><thead><tr><th>{{ t("reports.colStaff") }}</th><th>{{ t("reports.colData") }}</th><th>{{ t("reports.colResponse") }}</th><th>{{ t("reports.colCustomer") }}</th><th>{{ t("reports.colMeeting") }}</th><th>{{ t("reports.colScore") }}</th><th>{{ t("reports.colSales") }}</th><th>{{ t("reports.colRevenue") }}</th></tr></thead><tbody><tr v-for="person in report.personnel" :key="person.id"><td><strong>{{ person.name }}</strong></td><td>{{ person.leads }}</td><td>{{ person.responses }}</td><td>{{ person.conversions }}</td><td>{{ person.meetings }}</td><td>{{ person.averageScore || t("common.dash") }}</td><td>{{ person.wonDeals }}</td><td><strong>{{ currency.format(person.revenue) }}</strong><i class="mini-revenue"><b :style="{ width: `${person.revenue / maxPersonnelRevenue * 100}%` }"></b></i></td></tr></tbody></table></div></section>
    <section class="panel report-wide"><div class="panel-header"><div><p class="eyebrow">{{ t("reports.channelEyebrow") }}</p><h3>{{ t("reports.channelTitle") }}</h3></div></div><div class="source-cards"><article v-for="item in report.sourcePerformance" :key="item.source"><strong>{{ item.source }}</strong><span>{{ t("reports.sourceLeads", { count: item.leads }) }}</span><span>{{ t("reports.sourceResponses", { count: item.responses }) }}</span><span>{{ t("reports.sourceCustomers", { count: item.conversions }) }}</span><b>%{{ item.rate }}</b></article><p v-if="!report.sourcePerformance.length" class="empty-state">{{ t("reports.emptySource") }}</p></div></section>
  </div>
</template>
