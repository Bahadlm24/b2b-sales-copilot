<script setup>
import { computed, ref } from "vue";
import SummaryGrid from "../components/SummaryGrid.vue";
import { dateLocale, formatDate, formatMoney, formatStatus, t } from "../i18n/localeStore.js";
import { salesStore } from "../stores/salesStore";

const currency = computed(() => new Intl.NumberFormat(dateLocale.value, { style: "currency", currency: "TRY", maximumFractionDigits: 0 }));
const ownerFilter = ref("mine");
const canViewTeam = computed(() => ["admin", "manager"].includes(salesStore.currentUser.value.role));
const matchesOwner = (item) => ownerFilter.value === "all" || item.ownerId === salesStore.currentUser.value.id;
const priorityTasks = computed(() => salesStore.openTasks.value.filter(matchesOwner).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 4));
const recentMeetings = computed(() => salesStore.state.meetings.filter((item) => item.ownerId === salesStore.currentUser.value.id).slice(0, 1));
const dashboardOffers = computed(() => salesStore.activeOffers.value.filter(matchesOwner));
const strongestOffers = computed(() => [...dashboardOffers.value].sort((a, b) => b.probability - a.probability).slice(0, 3));
const filteredLeads = computed(() => salesStore.state.leads.filter((item) => !item.archived && matchesOwner(item)));
const filteredPipeline = computed(() => dashboardOffers.value.reduce((sum, offer) => sum + offer.numericAmount, 0));
const filteredWeighted = computed(() => dashboardOffers.value.reduce((sum, offer) => sum + offer.numericAmount * offer.probability / 100, 0));
const summaryItems = computed(() => [
  { label: t("dashboard.pipeline"), value: currency.value.format(filteredPipeline.value), hint: t("dashboard.openOffers", { count: dashboardOffers.value.length }) },
  { label: t("dashboard.weighted"), value: currency.value.format(filteredWeighted.value), hint: t("dashboard.weightedHint") },
  { label: t("dashboard.leadFollow"), value: `${filteredLeads.value.length} / ${priorityTasks.value.length}`, hint: t("dashboard.selectedView") },
]);
</script>

<template>
  <section class="welcome-banner">
    <div>
      <p class="eyebrow light">{{ t("dashboard.eyebrow") }}</p>
      <h2>{{ t("dashboard.title") }}</h2>
      <p>{{ t("dashboard.intro", { tasks: salesStore.openTasks.value.length }) }}</p>
    </div>
    <div class="dashboard-actions"><select v-if="canViewTeam" v-model="ownerFilter" class="select-input"><option value="mine">{{ t("dashboard.mine") }}</option><option value="all">{{ t("dashboard.team") }}</option></select><span v-else class="personal-scope">{{ t("dashboard.personalScope") }}</span><RouterLink class="dashboard-analysis-button" to="/meeting">{{ t("dashboard.startAnalysis") }} <b>→</b></RouterLink></div>
  </section>

  <SummaryGrid extra-class="dashboard-summary" :items="summaryItems" />

  <div class="dashboard-grid">
    <section class="panel">
      <div class="panel-header"><div><p class="eyebrow">{{ t("dashboard.priorityEyebrow") }}</p><h3>{{ t("dashboard.priorityTitle") }}</h3></div><RouterLink class="text-link" to="/tasks">{{ t("dashboard.seeAll") }}</RouterLink></div>
      <div class="compact-list">
        <label v-for="task in priorityTasks" :key="task.id" class="task-preview">
          <input type="checkbox" :checked="task.completed" @change="salesStore.toggleTask(task.id)" />
          <span><strong>{{ task.title }}</strong><small>{{ salesStore.customerName(task.customerId) }} · {{ formatStatus(task.priority) }}</small></span>
        </label>
      </div>
    </section>
    <section class="panel">
      <div class="panel-header"><div><p class="eyebrow">{{ t("dashboard.strongEyebrow") }}</p><h3>{{ t("dashboard.strongTitle") }}</h3></div><RouterLink class="text-link" to="/offers">{{ t("nav.offers") }}</RouterLink></div>
      <article v-for="offer in strongestOffers" :key="offer.id" class="offer">
        <div class="offer-top"><span>{{ offer.customer }}</span><span class="offer-status">%{{ offer.probability }}</span></div>
        <h4>{{ offer.title }}</h4><div class="offer-bottom"><strong>{{ formatMoney(offer.numericAmount) }}</strong><small>{{ formatStatus(offer.status) }}</small></div>
      </article>
    </section>
    <section class="panel detail-wide">
      <div class="panel-header"><div><p class="eyebrow">{{ t("dashboard.lastMeeting") }}</p><h3>{{ t("dashboard.lastMeetingTitle") }}</h3></div><RouterLink class="text-link" to="/meetings">{{ t("dashboard.history") }}</RouterLink></div>
      <div v-if="recentMeetings.length" class="history-preview-grid">
        <article v-for="meeting in recentMeetings" :key="meeting.id" class="history-preview">
          <strong>{{ salesStore.customerName(meeting.customerId) }}</strong>
          <span>{{ formatDate(meeting.createdAt) }}</span>
          <small>{{ t("dashboard.insightWords", { insights: meeting.insights?.length || 0, words: meeting.wordCount || 0 }) }}</small>
        </article>
      </div>
      <div v-else class="empty-state">{{ t("dashboard.emptyMeetings") }}</div>
    </section>
  </div>
</template>
