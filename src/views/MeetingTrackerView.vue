<script setup>
import { computed, reactive, ref } from "vue";
import OwnerSelect from "../components/OwnerSelect.vue";
import { dateLocale, formatDate, formatStatus, t } from "../i18n/localeStore.js";
import { salesStore } from "../stores/salesStore";

const filters = reactive({ search: "", status: "all", owner: "all", entityType: "all" });
const form = reactive({ entityType: "lead", entityId: "", ownerId: salesStore.currentUser.value.id, scheduledAt: "", notes: "" });
const editingId = ref(null);
const draft = reactive({ status: "", scheduledAt: "", result: "", notes: "", ownerId: null });
const feedback = ref("");
const statuses = ["Görüşme planlandı", "Görüşme sağlandı", "Tekrar görüşme planlandı", "Karar aşaması", "Olumlu", "Olumsuz"];
const progressFor = (status) => ({ "Görüşme planlandı": 20, "Görüşme sağlandı": 45, "Tekrar görüşme planlandı": 60, "Karar aşaması": 82, "Olumlu": 100, "Olumsuz": 100 }[status] || 0);
const entities = computed(() => form.entityType === "lead"
  ? salesStore.state.leads.filter((item) => !item.archived && !item.convertedCustomerId).map((item) => ({ id: item.id, name: item.company || item.name }))
  : salesStore.customers.filter((item) => !item.archived).map((item) => ({ id: item.id, name: item.name })));
const rows = computed(() => salesStore.state.meetingJourneys.filter((item) => {
  const name = salesStore.journeyEntityName(item).toLocaleLowerCase(dateLocale.value);
  return (filters.status === "all" || item.status === filters.status)
    && (filters.owner === "all" || item.ownerId === Number(filters.owner))
    && (filters.entityType === "all" || item.entityType === filters.entityType)
    && name.includes(filters.search.toLocaleLowerCase(dateLocale.value));
}));
const summary = computed(() => ({
  planned: salesStore.state.meetingJourneys.filter((item) => item.status.includes("planlandı")).length,
  held: salesStore.state.meetingJourneys.filter((item) => item.status === "Görüşme sağlandı").length,
  decision: salesStore.state.meetingJourneys.filter((item) => item.status === "Karar aşaması").length,
  closed: salesStore.state.meetingJourneys.filter((item) => ["Olumlu", "Olumsuz"].includes(item.status)).length,
}));

function resetEntity() { form.entityId = ""; }
function createJourney() {
  const result = salesStore.createMeetingJourney(form);
  feedback.value = result.message || t("tracker.created");
  if (result.ok) Object.assign(form, { entityId: "", scheduledAt: "", notes: "" });
}
function edit(item) {
  editingId.value = item.id;
  Object.assign(draft, { status: item.status, scheduledAt: item.scheduledAt, result: item.result || "", notes: item.notes || "", ownerId: item.ownerId });
}
function save(item) {
  const result = salesStore.updateMeetingJourney(item.id, draft);
  feedback.value = result.message || t("tracker.updated");
  if (result.ok && draft.status === "Olumlu" && item.entityType === "lead") {
    const conversion = salesStore.convertLeadToCustomer(item.entityId);
    if (conversion.ok) {
      salesStore.linkJourneyToCustomer(item.id, conversion.customer.id);
      feedback.value = t("tracker.converted", { name: conversion.customer.name });
    } else feedback.value = conversion.message;
  }
  if (result.ok) editingId.value = null;
}
</script>

<template>
  <section class="tracker-summary">
    <article><small>{{ t("tracker.planned") }}</small><strong>{{ summary.planned }}</strong><span>{{ t("tracker.upcoming") }}</span></article>
    <article><small>{{ t("tracker.held") }}</small><strong>{{ summary.held }}</strong><span>{{ t("tracker.waitingResult") }}</span></article>
    <article><small>{{ t("tracker.decision") }}</small><strong>{{ summary.decision }}</strong><span>{{ t("tracker.closeFollow") }}</span></article>
    <article><small>{{ t("tracker.closed") }}</small><strong>{{ summary.closed }}</strong><span>{{ t("tracker.posNeg") }}</span></article>
  </section>

  <section class="panel tracker-flow">
    <div class="panel-header"><div><p class="eyebrow">{{ t("tracker.flowEyebrow") }}</p><h3>{{ t("tracker.flowTitle") }}</h3></div></div>
    <div class="flow-diagram">
      <span>{{ t("tracker.lead") }}</span><b>→</b><span>{{ t("tracker.plannedStep") }}</span><b>→</b><span>{{ t("tracker.heldStep") }}</span><b>↻</b><span>{{ t("tracker.newMeeting") }}</span><b>→</b><span>{{ t("tracker.decisionStep") }}</span><b>→</b><span class="positive">{{ t("tracker.activeCustomer") }}</span><span class="negative">{{ t("tracker.negative") }}</span>
    </div>
  </section>

  <section class="panel tracker-create">
    <div class="panel-header"><div><p class="eyebrow">{{ t("tracker.newEyebrow") }}</p><h3>{{ t("tracker.newTitle") }}</h3></div></div>
    <form class="tracker-form" @submit.prevent="createJourney">
      <label><span>{{ t("tracker.recordType") }}</span><select v-model="form.entityType" class="select-input" @change="resetEntity"><option value="lead">{{ t("tracker.potential") }}</option><option value="customer">{{ t("tracker.customer") }}</option></select></label>
      <label><span>{{ t("tracker.companyPerson") }}</span><select v-model.number="form.entityId" class="select-input" required><option value="">{{ t("common.select") }}</option><option v-for="item in entities" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
      <label><span>{{ t("tracker.meetingDate") }}</span><input v-model="form.scheduledAt" class="search-input" type="datetime-local" required /></label>
      <label><span>{{ t("common.owner") }}</span><OwnerSelect v-model="form.ownerId" /></label>
      <label class="tracker-notes"><span>{{ t("tracker.notes") }}</span><input v-model="form.notes" class="search-input" :placeholder="t('tracker.notesPh')" /></label>
      <button class="primary-button compact">{{ t("tracker.plan") }}</button>
    </form>
    <p v-if="feedback" class="form-feedback">{{ feedback }}</p>
  </section>

  <section class="panel tracker-sheet">
    <div class="list-toolbar tracker-toolbar"><div><p class="eyebrow">{{ t("tracker.sheetEyebrow") }}</p><h3>{{ t("tracker.sheetTitle") }}</h3></div><input v-model="filters.search" class="search-input" :placeholder="t('tracker.search')" /><select v-model="filters.status" class="select-input"><option value="all">{{ t("common.all") }}</option><option v-for="status in statuses" :key="status" :value="status">{{ formatStatus(status) }}</option></select><select v-model="filters.owner" class="select-input"><option value="all">{{ t("tracker.allStaff") }}</option><option v-for="user in salesStore.state.users" :key="user.id" :value="user.id">{{ user.name }}</option></select></div>
    <div class="sheet-scroll">
      <table class="meeting-sheet"><thead><tr><th>{{ t("tracker.company") }}</th><th>{{ t("tracker.type") }}</th><th>{{ t("tracker.round") }}</th><th>{{ t("common.status") }}</th><th>{{ t("tracker.meetingDateCol") }}</th><th>{{ t("common.owner") }}</th><th>{{ t("tracker.result") }}</th><th>{{ t("common.actions") }}</th></tr></thead>
        <tbody><tr v-for="item in rows" :key="item.id">
          <td><strong>{{ salesStore.journeyEntityName(item) }}</strong><small>{{ item.entityType === 'lead' ? t("tracker.potential") : t("tracker.customer") }}</small></td>
          <td><span class="sheet-type">{{ item.entityType === "lead" ? t("tracker.leadType") : t("tracker.customerType") }}</span></td><td><b>{{ t("tracker.roundLabel", { round: item.round }) }}</b></td>
          <template v-if="editingId === item.id">
            <td><select v-model="draft.status" class="select-input"><option v-for="status in statuses" :key="status" :value="status">{{ formatStatus(status) }}</option></select></td>
            <td><input v-model="draft.scheduledAt" class="search-input" type="datetime-local" /></td>
            <td><select v-model.number="draft.ownerId" class="select-input"><option v-for="user in salesStore.state.users" :key="user.id" :value="user.id">{{ user.name }}</option></select></td>
            <td><input v-model="draft.result" class="search-input" :placeholder="t('tracker.resultPh')" /></td>
            <td><button class="primary-button compact" @click="save(item)">{{ t("common.save") }}</button><button class="text-link" @click="editingId = null">{{ t("common.cancel") }}</button></td>
          </template>
          <template v-else>
            <td><span class="journey-status" :class="item.status === 'Olumlu' ? 'success' : item.status === 'Olumsuz' ? 'danger' : ''">{{ formatStatus(item.status) }}</span><i class="journey-progress" :class="{ success: item.status === 'Olumlu', danger: item.status === 'Olumsuz' }"><b :style="{ width: `${progressFor(item.status)}%` }"></b></i></td>
            <td>{{ formatDate(item.scheduledAt) }}</td><td>{{ salesStore.userName(item.ownerId) }}</td><td><span>{{ item.result || item.notes || t("common.dash") }}</span><small>{{ t("tracker.historyMoves", { count: item.history?.length || 1 }) }}</small></td><td><button class="secondary-button" @click="edit(item)">{{ t("tracker.update") }}</button></td>
          </template>
        </tr><tr v-if="!rows.length"><td colspan="8" class="empty-state">{{ t("tracker.empty") }}</td></tr></tbody>
      </table>
    </div>
  </section>
</template>
