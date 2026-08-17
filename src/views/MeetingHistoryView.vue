<script setup>
import { ref } from "vue";
import { formatDate, formatStatus, t } from "../i18n/localeStore.js";
import { salesStore } from "../stores/salesStore";

const editingId = ref(null);
const draft = ref("");
function startEdit(meeting) {
  editingId.value = meeting.id;
  draft.value = meeting.transcript;
}
function saveEdit(meeting) {
  if (salesStore.updateMeeting(meeting.id, draft.value)) editingId.value = null;
}
</script>

<template>
  <section class="panel table-panel">
    <div class="list-toolbar"><div><p class="eyebrow">{{ t("meetingHistory.eyebrow") }}</p><h3>{{ t("meetingHistory.title") }}</h3></div><RouterLink class="primary-button compact link-button" to="/meeting">{{ t("meetingHistory.newAnalysis") }}</RouterLink></div>
    <div v-if="salesStore.state.meetings.length" class="meeting-history">
      <article v-for="meeting in salesStore.state.meetings" :key="meeting.id" class="meeting-history-item">
        <div class="meeting-history-head"><div><strong>{{ salesStore.customerName(meeting.customerId) }}</strong><small>{{ t("meetingHistory.meta", { date: formatDate(meeting.meetingDate || meeting.createdAt), owner: salesStore.userName(meeting.ownerId), words: meeting.wordCount }) }}</small></div><div class="record-actions"><button class="secondary-button" @click="startEdit(meeting)">{{ t("common.edit") }}</button><button class="danger-button" @click="salesStore.deleteMeeting(meeting.id)">{{ t("common.delete") }}</button></div></div>
        <template v-if="editingId === meeting.id"><textarea v-model="draft" class="meeting-edit-textarea"></textarea><div class="record-actions"><button class="primary-button compact" @click="saveEdit(meeting)">{{ t("common.save") }}</button><button class="secondary-button" @click="editingId = null">{{ t("common.cancel") }}</button></div></template>
        <p v-else>{{ meeting.transcript }}</p>
        <div v-if="meeting.conversationAnalysis" class="history-score"><strong>{{ meeting.conversationAnalysis.overallScore }}/100</strong><span>{{ formatStatus(meeting.conversationAnalysis.dealHealth) }}</span><small>{{ t("meetingHistory.scoreMeta", { risks: meeting.conversationAnalysis.risks.length, questions: meeting.conversationAnalysis.questionCount }) }}</small></div>
        <div class="history-tags"><span v-for="insight in meeting.insights" :key="insight.id">{{ insight.title }}</span></div>
      </article>
    </div>
    <div v-else class="empty-state large-empty">{{ t("meetingHistory.empty") }}</div>
  </section>
</template>
