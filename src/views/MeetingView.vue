<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { initialTranscript } from "../data/mockData";
import { analyzeTranscript, buildNextMeetingPlan } from "../services/meetingAnalyzer";
import { salesStore } from "../stores/salesStore";

const route = useRoute();
const router = useRouter();
const transcript = ref(initialTranscript);
const isAnalyzing = ref(false);
const showAnalysis = ref(true);
const insights = ref(analyzeTranscript(initialTranscript));
const nextMeetingPlan = ref(buildNextMeetingPlan(initialTranscript, insights.value));
const savedMessage = ref("");
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
function analyzeMeeting() {
  if (!transcript.value.trim()) return;
  isAnalyzing.value = true;
  showAnalysis.value = false;
  window.setTimeout(() => {
    insights.value = analyzeTranscript(transcript.value);
    nextMeetingPlan.value = buildNextMeetingPlan(transcript.value, insights.value);
    salesStore.saveMeeting({
      customerId: customer.value.id,
      ownerId: selectedOwnerId.value,
      meetingDate: meetingDate.value,
      transcript: transcript.value.trim(),
      wordCount: wordCount.value,
      insights: insights.value,
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
    <label><span>Sorumlu personel</span><select v-model.number="selectedOwnerId" class="select-input"><option v-for="user in salesStore.state.users.filter(x => x.active)" :key="user.id" :value="user.id">{{ user.name }}</option></select></label>
  </section>
  <section v-if="!customer" class="panel not-found"><span>404</span><h2>Müşteri bulunamadı veya arşivlenmiş.</h2><RouterLink class="primary-button compact link-button" to="/customers">Müşterilere dön</RouterLink></section>
  <div v-if="customer" class="workspace-grid">
    <section class="panel meeting-panel">
      <div class="panel-header"><div><p class="eyebrow">TOPLANTI GİRDİSİ</p><h3>Konuşma metni</h3></div><span class="counter">{{ wordCount }} kelime</span></div>
      <textarea v-model="transcript" placeholder="Toplantı konuşmasını buraya yapıştırın..."></textarea>
      <div class="helper"><span>ⓘ</span><p>İlk sürüm metin üzerinden çalışır. Canlı ses bağlantısını sonraki aşamada ekleyeceğiz.</p></div>
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
