<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import OwnerSelect from "../components/OwnerSelect.vue";
import { initialTranscript } from "../data/mockData";
import { formatMoney, formatStatus, locale, t } from "../i18n/localeStore.js";
import { analyzeConversation, analyzeTranscript, buildNextMeetingPlan } from "../services/meetingAnalyzer";
import { salesStore } from "../stores/salesStore";

const route = useRoute();
const router = useRouter();
const transcript = ref(initialTranscript);
const isAnalyzing = ref(false);
const showAnalysis = ref(true);
const insights = ref(analyzeTranscript(initialTranscript, locale.value));
const nextMeetingPlan = ref(buildNextMeetingPlan(initialTranscript, insights.value, locale.value));
const conversationAnalysis = ref(analyzeConversation(initialTranscript, locale.value));
const savedMessage = ref("");
const liveSyncState = ref(t("meeting.waiting"));
let liveSyncTimer;
const activeCustomers = computed(() => salesStore.customers.filter((item) => !item.archived));
const selectedCustomerId = ref(Number(route.query.customer) || activeCustomers.value[0]?.id);
const selectedOwnerId = ref(salesStore.currentUser.value.id);
const meetingDate = ref(new Date().toISOString().slice(0, 16));
const customer = computed(() => activeCustomers.value.find((item) => item.id === selectedCustomerId.value) || null);
const customerOffers = computed(() => salesStore.state.offers.filter((item) => item.customerId === customer.value.id));
const wordCount = computed(() => transcript.value.trim() ? transcript.value.trim().split(/\s+/).length : 0);
watch(selectedCustomerId, (id) => {
  router.replace({ query: { ...route.query, customer: id } });
});
watch(locale, () => {
  insights.value = analyzeTranscript(transcript.value, locale.value);
  nextMeetingPlan.value = buildNextMeetingPlan(transcript.value, insights.value, locale.value);
  conversationAnalysis.value = analyzeConversation(transcript.value, locale.value);
  if (liveSyncState.value === "bekleniyor" || liveSyncState.value === "waiting") liveSyncState.value = t("meeting.waiting");
});
function syncLiveTranscript() {
  const session = salesStore.state.liveMeetingSessions.find((item) => item.customerId === selectedCustomerId.value && item.status !== "completed");
  if (!session?.segments?.length) return;
  const nextTranscript = session.segments.map((item) => `${item.speaker || t("meeting.speaker")}: ${item.text}`).join("\n");
  if (nextTranscript !== transcript.value) {
    transcript.value = nextTranscript;
    liveSyncState.value = t("meeting.synced", { platform: session.platform || t("nav.meeting"), count: session.segments.length });
  }
}
onMounted(() => { syncLiveTranscript(); liveSyncTimer = window.setInterval(syncLiveTranscript, 1000); });
onUnmounted(() => window.clearInterval(liveSyncTimer));
function analyzeMeeting() {
  if (!transcript.value.trim()) return;
  isAnalyzing.value = true;
  showAnalysis.value = false;
  window.setTimeout(() => {
    insights.value = analyzeTranscript(transcript.value, locale.value);
    nextMeetingPlan.value = buildNextMeetingPlan(transcript.value, insights.value, locale.value);
    conversationAnalysis.value = analyzeConversation(transcript.value, locale.value);
    salesStore.saveMeeting({
      customerId: customer.value.id,
      ownerId: selectedOwnerId.value,
      meetingDate: meetingDate.value,
      transcript: transcript.value.trim(),
      wordCount: wordCount.value,
      insights: insights.value,
      conversationAnalysis: conversationAnalysis.value,
    });
    isAnalyzing.value = false;
    showAnalysis.value = true;
    savedMessage.value = t("meeting.saved");
    window.setTimeout(() => { savedMessage.value = ""; }, 2500);
  }, 500);
}
</script>

<template>
  <section v-if="customer" class="customer-card">
    <div class="company-logo">{{ customer.initials }}</div>
    <div class="customer-main">
      <div class="title-row"><h2>{{ customer.name }}</h2><span class="stage-badge">{{ formatStatus(customer.stage) }}</span></div>
      <p>{{ customer.contact }} · {{ customer.role }}</p>
      <div class="meta-row"><span>{{ t("meeting.lastContact") }} <strong>{{ customer.lastContact }}</strong></span><span class="divider"></span><span>{{ t("meeting.score") }} <strong class="score">{{ customer.score }}/100</strong></span></div>
    </div>
    <label class="customer-picker">
      <span>{{ t("meeting.customer") }}</span>
      <select v-model="selectedCustomerId" class="select-input">
        <option v-for="item in activeCustomers" :key="item.id" :value="item.id">{{ item.name }}</option>
      </select>
    </label>
  </section>
  <section v-if="customer" class="meeting-meta-panel">
    <label><span>{{ t("meeting.date") }}</span><input v-model="meetingDate" class="search-input" type="datetime-local" /></label>
    <label><span>{{ t("common.ownerStaff") }}</span><OwnerSelect v-model="selectedOwnerId" /></label>
  </section>
  <section v-if="!customer" class="panel not-found"><span>404</span><h2>{{ t("meeting.missing") }}</h2><RouterLink class="primary-button compact link-button" to="/customers">{{ t("meeting.backCustomers") }}</RouterLink></section>
  <div v-if="customer" class="workspace-grid">
    <section class="panel meeting-panel">
      <div class="panel-header"><div><p class="eyebrow">{{ t("meeting.inputEyebrow") }}</p><h3>{{ t("meeting.transcript") }}</h3></div><span class="live-transcript-state"><i></i>{{ liveSyncState }}</span><span class="counter">{{ wordCount }} {{ t("common.words") }}</span></div>
      <textarea v-model="transcript" :placeholder="t('meeting.placeholder')"></textarea>
      <div class="helper"><span>ⓘ</span><p>{{ t("meeting.helper") }}</p></div>
      <button class="primary-button" :disabled="isAnalyzing || !transcript.trim()" @click="analyzeMeeting"><span v-if="isAnalyzing" class="spinner"></span>{{ isAnalyzing ? t("meeting.analyzing") : t("meeting.analyze") }}</button>
      <p v-if="savedMessage" class="success-message" role="status">{{ savedMessage }}</p>
    </section>
    <section class="panel offer-panel">
      <div class="panel-header"><div><p class="eyebrow">{{ t("meeting.crmEyebrow") }}</p><h3>{{ t("meeting.openOffers") }}</h3></div><span class="count-badge">{{ customerOffers.length }}</span></div>
      <article v-for="offer in customerOffers" :key="offer.no" class="offer">
        <div class="offer-top"><span>{{ offer.no }}</span><span class="offer-status">{{ formatStatus(offer.status) }}</span></div>
        <h4>{{ offer.title }}</h4><div class="offer-bottom"><strong>{{ formatMoney(offer.numericAmount) }}</strong><small>{{ t("meeting.until", { date: offer.validUntil }) }}</small></div>
      </article>
      <p v-if="!customerOffers.length" class="empty-state">{{ t("meeting.noOffers") }}</p>
    </section>
  </div>
  <section v-if="customer && showAnalysis" class="analysis-section">
    <section class="conversation-scorecard panel">
      <div class="scorecard-overview"><div class="score-ring" :style="{ '--score': conversationAnalysis.overallScore }"><strong>{{ conversationAnalysis.overallScore }}</strong><span>/100</span></div><div><p class="eyebrow">{{ t("meeting.healthEyebrow") }}</p><h3>{{ formatStatus(conversationAnalysis.dealHealth) }}</h3><p>{{ conversationAnalysis.summary || t("meeting.needText") }}</p></div></div>
      <div class="score-dimensions"><article v-for="dimension in conversationAnalysis.dimensions" :key="dimension.key"><div><span>{{ dimension.label }}</span><strong>{{ dimension.score }}</strong></div><div class="score-bar"><i :style="{ width: `${dimension.score}%` }"></i></div></article></div>
      <div class="conversation-metrics"><span><strong>{{ conversationAnalysis.questionCount }}</strong>{{ t("meeting.questions") }}</span><span><strong>{{ conversationAnalysis.objectionCount }}</strong>{{ t("meeting.objections") }}</span><span><strong>{{ conversationAnalysis.commitmentCount }}</strong>{{ t("meeting.commitments") }}</span><span><strong>{{ conversationAnalysis.talkRatio === null ? t("common.dash") : `%${conversationAnalysis.talkRatio}` }}</strong>{{ t("meeting.talkRatio") }}</span></div>
    </section>
    <div class="coaching-findings">
      <section class="panel"><p class="eyebrow">{{ t("meeting.strengthsEyebrow") }}</p><h3>{{ t("meeting.strengthsTitle") }}</h3><ul><li v-for="item in conversationAnalysis.strengths" :key="item">{{ item }}</li><li v-if="!conversationAnalysis.strengths.length">{{ t("meeting.noStrengths") }}</li></ul></section>
      <section class="panel risk-panel"><p class="eyebrow">{{ t("meeting.risksEyebrow") }}</p><h3>{{ t("meeting.risksTitle") }}</h3><ul><li v-for="item in conversationAnalysis.risks" :key="item">{{ item }}</li><li v-if="!conversationAnalysis.risks.length">{{ t("meeting.noRisks") }}</li></ul></section>
    </div>
    <div class="section-title"><div><p class="eyebrow">{{ t("meeting.coachEyebrow") }}</p><h3>{{ t("meeting.coachTitle") }}</h3></div><span>{{ t("meeting.insightsFound", { count: insights.length }) }}</span></div>
    <div class="insight-grid">
      <article v-for="item in insights" :key="item.id" class="insight" :class="{ blue: item.type === 'term', amber: item.type === 'objection', green: item.type === 'question' }">
        <span class="insight-icon">{{ item.type === "term" ? "Aa" : item.type === "objection" ? "!" : "?" }}</span><p class="eyebrow">{{ item.eyebrow }}</p><h4>{{ item.title }}</h4><p>{{ item.text }}</p>
      </article>
    </div>
    <section class="next-meeting-panel">
      <div><p class="eyebrow">{{ t("meeting.nextEyebrow") }}</p><h3>{{ t("meeting.nextTitle") }}</h3><p>{{ t("meeting.nextHint") }}</p></div>
      <ol><li v-for="(item, index) in nextMeetingPlan" :key="item"><span>{{ String(index + 1).padStart(2, '0') }}</span><p>{{ item }}</p></li></ol>
    </section>
  </section>
</template>
