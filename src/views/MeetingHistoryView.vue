<script setup>
import { ref } from "vue";
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
    <div class="list-toolbar"><div><p class="eyebrow">TOPLANTI HAFIZASI</p><h3>Analiz geçmişi</h3></div><RouterLink class="primary-button compact link-button" to="/meeting">Yeni analiz</RouterLink></div>
    <div v-if="salesStore.state.meetings.length" class="meeting-history">
      <article v-for="meeting in salesStore.state.meetings" :key="meeting.id" class="meeting-history-item">
        <div class="meeting-history-head"><div><strong>{{ salesStore.customerName(meeting.customerId) }}</strong><small>{{ new Date(meeting.meetingDate || meeting.createdAt).toLocaleString("tr-TR") }} · {{ salesStore.userName(meeting.ownerId) }} · {{ meeting.wordCount }} kelime</small></div><div class="record-actions"><button class="secondary-button" @click="startEdit(meeting)">Düzenle</button><button class="danger-button" @click="salesStore.deleteMeeting(meeting.id)">Sil</button></div></div>
        <template v-if="editingId === meeting.id"><textarea v-model="draft" class="meeting-edit-textarea"></textarea><div class="record-actions"><button class="primary-button compact" @click="saveEdit(meeting)">Kaydet</button><button class="secondary-button" @click="editingId = null">Vazgeç</button></div></template>
        <p v-else>{{ meeting.transcript }}</p>
        <div v-if="meeting.conversationAnalysis" class="history-score"><strong>{{ meeting.conversationAnalysis.overallScore }}/100</strong><span>{{ meeting.conversationAnalysis.dealHealth }}</span><small>{{ meeting.conversationAnalysis.risks.length }} risk · {{ meeting.conversationAnalysis.questionCount }} soru sinyali</small></div>
        <div class="history-tags"><span v-for="insight in meeting.insights" :key="insight.id">{{ insight.title }}</span></div>
      </article>
    </div>
    <div v-else class="empty-state large-empty">Henüz toplantı analizi kaydedilmedi.</div>
  </section>
</template>
