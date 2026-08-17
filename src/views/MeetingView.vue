<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import OwnerSelect from "../components/OwnerSelect.vue";
import { initialTranscript } from "../data/mockData";
import { analyzeConversation, analyzeTranscript, buildNextMeetingPlan } from "../services/meetingAnalyzer";
import { salesStore } from "../stores/salesStore";

const route = useRoute();
const router = useRouter();
const transcript = ref(initialTranscript);
const isAnalyzing = ref(false);
const showAnalysis = ref(true);
const insights = ref(analyzeTranscript(initialTranscript));
const nextMeetingPlan = ref(buildNextMeetingPlan(initialTranscript, insights.value));
const conversationAnalysis = ref(analyzeConversation(initialTranscript));
const savedMessage = ref("");
const liveSyncState = ref("bekleniyor");
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
function syncLiveTranscript() {
  const session = salesStore.state.liveMeetingSessions.find((item) => item.customerId === selectedCustomerId.value && item.status !== "completed");
  if (!session?.segments?.length) return;
  const nextTranscript = session.segments.map((item) => `${item.speaker || "Konuşmacı"}: ${item.text}`).join("\n");
  if (nextTranscript !== transcript.value) {
    transcript.value = nextTranscript;
    liveSyncState.value = `${session.platform || "Toplantı"} · ${session.segments.length} konuşma parçası senkronize edildi`;
  }
}
onMounted(() => { syncLiveTranscript(); liveSyncTimer = window.setInterval(syncLiveTranscript, 1000); });
onUnmounted(() => window.clearInterval(liveSyncTimer));
function analyzeMeeting() {
  if (!transcript.value.trim()) return;
  isAnalyzing.value = true;
  showAnalysis.value = false;
  window.setTimeout(() => {
    insights.value = analyzeTranscript(transcript.value);
    nextMeetingPlan.value = buildNextMeetingPlan(transcript.value, insights.value);
    conversationAnalysis.value = analyzeConversation(transcript.value);
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
    savedMessage.value = "Analiz toplantı geçmişine kaydedildi.";
    window.setTimeout(() => { savedMessage.value = ""; }, 2500);
  }, 500);
}
</script>

<template>
  <section v-if="customer" class="customer-card">
    <div class="company-logo">{{ customer.initials }}</div>
    <div class="customer-main">
      <div class="title-row"><h2>{{ customer.name }}</h2><span class="stage-badge">{{ customer.stage }}</span></div>
      <p>{{ customer.contact }} · {{ customer.role }}</p>
      <div class="meta-row"><span>Son görüşme: <strong>{{ customer.lastContact }}</strong></span><span class="divider"></span><span>Fırsat skoru: <strong class="score">{{ customer.score }}/100</strong></span></div>
    </div>
    <label class="customer-picker">
      <span>Müşteri</span>
      <select v-model="selectedCustomerId" class="select-input">
        <option v-for="item in activeCustomers" :key="item.id" :value="item.id">{{ item.name }}</option>
      </select>
    </label>
  </section>
  <section v-if="customer" class="meeting-meta-panel">
    <label><span>Toplantı tarihi</span><input v-model="meetingDate" class="search-input" type="datetime-local" /></label>
    <label><span>Sorumlu personel</span><OwnerSelect v-model="selectedOwnerId" /></label>
  </section>
  <section v-if="!customer" class="panel not-found"><span>404</span><h2>Müşteri bulunamadı veya arşivlenmiş.</h2><RouterLink class="primary-button compact link-button" to="/customers">Müşterilere dön</RouterLink></section>
  <div v-if="customer" class="workspace-grid">
    <section class="panel meeting-panel">
      <div class="panel-header"><div><p class="eyebrow">TOPLANTI GİRDİSİ</p><h3>Konuşma metni</h3></div><span class="live-transcript-state"><i></i>{{ liveSyncState }}</span><span class="counter">{{ wordCount }} kelime</span></div>
      <textarea v-model="transcript" placeholder="Toplantı konuşmasını buraya yapıştırın..."></textarea>
      <div class="helper"><span>ⓘ</span><p>Meet, Teams veya Zoom eklentisinden gelen konuşma parçaları seçili müşteriyle eşleştiğinde bu alan otomatik güncellenir; gerektiğinde metni elle de düzenleyebilirsin.</p></div>
      <button class="primary-button" :disabled="isAnalyzing || !transcript.trim()" @click="analyzeMeeting"><span v-if="isAnalyzing" class="spinner"></span>{{ isAnalyzing ? "Analiz ediliyor..." : "Satış analizini oluştur" }}</button>
      <p v-if="savedMessage" class="success-message" role="status">{{ savedMessage }}</p>
    </section>
    <section class="panel offer-panel">
      <div class="panel-header"><div><p class="eyebrow">CRM ÖZETİ</p><h3>Açık teklifler</h3></div><span class="count-badge">{{ customerOffers.length }}</span></div>
      <article v-for="offer in customerOffers" :key="offer.no" class="offer">
        <div class="offer-top"><span>{{ offer.no }}</span><span class="offer-status">{{ offer.status }}</span></div>
        <h4>{{ offer.title }}</h4><div class="offer-bottom"><strong>{{ offer.amount }}</strong><small>Son: {{ offer.validUntil }}</small></div>
      </article>
      <p v-if="!customerOffers.length" class="empty-state">Bu müşteri için açık teklif bulunmuyor.</p>
    </section>
  </div>
  <section v-if="customer && showAnalysis" class="analysis-section">
    <section class="conversation-scorecard panel">
      <div class="scorecard-overview"><div class="score-ring" :style="{ '--score': conversationAnalysis.overallScore }"><strong>{{ conversationAnalysis.overallScore }}</strong><span>/100</span></div><div><p class="eyebrow">FIRSAT SAĞLIĞI</p><h3>{{ conversationAnalysis.dealHealth }}</h3><p>{{ conversationAnalysis.summary || 'Özet oluşturmak için konuşma metni gerekli.' }}</p></div></div>
      <div class="score-dimensions"><article v-for="dimension in conversationAnalysis.dimensions" :key="dimension.key"><div><span>{{ dimension.label }}</span><strong>{{ dimension.score }}</strong></div><div class="score-bar"><i :style="{ width: `${dimension.score}%` }"></i></div></article></div>
      <div class="conversation-metrics"><span><strong>{{ conversationAnalysis.questionCount }}</strong>Soru sinyali</span><span><strong>{{ conversationAnalysis.objectionCount }}</strong>İtiraz</span><span><strong>{{ conversationAnalysis.commitmentCount }}</strong>Taahhüt</span><span><strong>{{ conversationAnalysis.talkRatio === null ? '—' : `%${conversationAnalysis.talkRatio}` }}</strong>Satışçı konuşma oranı</span></div>
    </section>
    <div class="coaching-findings">
      <section class="panel"><p class="eyebrow">GÜÇLÜ NOKTALAR</p><h3>İyi yapılanlar</h3><ul><li v-for="item in conversationAnalysis.strengths" :key="item">{{ item }}</li><li v-if="!conversationAnalysis.strengths.length">Henüz güçlü kabul edilecek yeterli sinyal bulunmadı.</li></ul></section>
      <section class="panel risk-panel"><p class="eyebrow">FIRSAT RİSKLERİ</p><h3>Eksik kalan noktalar</h3><ul><li v-for="item in conversationAnalysis.risks" :key="item">{{ item }}</li><li v-if="!conversationAnalysis.risks.length">Kritik bir eksik sinyal bulunmadı.</li></ul></section>
    </div>
    <div class="section-title"><div><p class="eyebrow">AKILLI SATIŞ KOÇU</p><h3>Toplantı önerileri</h3></div><span>{{ insights.length }} içgörü bulundu</span></div>
    <div class="insight-grid">
      <article v-for="item in insights" :key="item.id" class="insight" :class="{ blue: item.type === 'term', amber: item.type === 'objection', green: item.type === 'question' }">
        <span class="insight-icon">{{ item.type === "term" ? "Aa" : item.type === "objection" ? "!" : "?" }}</span><p class="eyebrow">{{ item.eyebrow }}</p><h4>{{ item.title }}</h4><p>{{ item.text }}</p>
      </article>
    </div>
    <section class="next-meeting-panel">
      <div><p class="eyebrow">SONRAKİ TOPLANTI PLANI</p><h3>Bir sonraki görüşmede bunları göz önünde bulundur</h3><p>Konuşmadaki sinyallere göre hazırlık önerileri dinamik olarak güncellendi.</p></div>
      <ol><li v-for="(item, index) in nextMeetingPlan" :key="item"><span>{{ String(index + 1).padStart(2, '0') }}</span><p>{{ item }}</p></li></ol>
    </section>
  </section>
</template>
