<script setup>
import { computed, ref } from "vue";
import { salesStore } from "../stores/salesStore";

const currency = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
const ownerFilter = ref("mine");
const matchesOwner = (item) => ownerFilter.value === "all" || item.ownerId === salesStore.currentUser.value.id;
const priorityTasks = computed(() => salesStore.openTasks.value.filter(matchesOwner).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 4));
const recentMeetings = computed(() => salesStore.state.meetings.filter(matchesOwner).slice(0, 3));
const dashboardOffers = computed(() => salesStore.activeOffers.value.filter(matchesOwner));
const strongestOffers = computed(() => [...dashboardOffers.value].sort((a, b) => b.probability - a.probability).slice(0, 3));
const filteredLeads = computed(() => salesStore.state.leads.filter((item) => !item.archived && matchesOwner(item)));
const filteredPipeline = computed(() => dashboardOffers.value.reduce((sum, offer) => sum + offer.numericAmount, 0));
const filteredWeighted = computed(() => dashboardOffers.value.reduce((sum, offer) => sum + offer.numericAmount * offer.probability / 100, 0));
</script>

<template>
  <section class="welcome-banner">
    <div>
      <p class="eyebrow light">GÜNÜN SATIŞ ODAĞI</p>
      <h2>Öncelikli fırsatlarını ilerlet.</h2>
      <p>{{ salesStore.openTasks.value.length }} açık takip ve karar aşamasında güçlü fırsatlar var.</p>
    </div>
    <div class="dashboard-actions"><select v-model="ownerFilter" class="select-input"><option value="mine">Yalnızca bana ait</option><option value="all">Tüm ekip</option></select><RouterLink class="primary-button compact link-button lime-button" to="/meeting">Yeni analiz başlat</RouterLink></div>
  </section>

  <section class="summary-grid dashboard-summary">
    <article class="summary-card"><small>TOPLAM PIPELINE</small><strong>{{ currency.format(filteredPipeline) }}</strong><span>{{ dashboardOffers.length }} açık teklif</span></article>
    <article class="summary-card"><small>AĞIRLIKLI TAHMİN</small><strong>{{ currency.format(filteredWeighted) }}</strong><span>Olasılığa göre</span></article>
    <article class="summary-card"><small>LEAD / AÇIK TAKİP</small><strong>{{ filteredLeads.length }} / {{ priorityTasks.length }}</strong><span>Seçili görünüm</span></article>
  </section>

  <div class="dashboard-grid">
    <section class="panel">
      <div class="panel-header"><div><p class="eyebrow">ÖNCELİKLİ TAKİPLER</p><h3>Bugün neyi ilerletmelisin?</h3></div><RouterLink class="text-link" to="/tasks">Tümünü gör</RouterLink></div>
      <div class="compact-list">
        <label v-for="task in priorityTasks" :key="task.id" class="task-preview">
          <input type="checkbox" :checked="task.completed" @change="salesStore.toggleTask(task.id)" />
          <span><strong>{{ task.title }}</strong><small>{{ salesStore.customerName(task.customerId) }} · {{ task.priority }}</small></span>
        </label>
      </div>
    </section>
    <section class="panel">
      <div class="panel-header"><div><p class="eyebrow">GÜÇLÜ FIRSATLAR</p><h3>Kapanışa en yakın teklifler</h3></div><RouterLink class="text-link" to="/offers">Teklifler</RouterLink></div>
      <article v-for="offer in strongestOffers" :key="offer.id" class="offer">
        <div class="offer-top"><span>{{ offer.customer }}</span><span class="offer-status">%{{ offer.probability }}</span></div>
        <h4>{{ offer.title }}</h4><div class="offer-bottom"><strong>{{ offer.amount }}</strong><small>{{ offer.status }}</small></div>
      </article>
    </section>
    <section class="panel detail-wide">
      <div class="panel-header"><div><p class="eyebrow">SON TOPLANTILAR</p><h3>Kaydedilen analizler</h3></div><RouterLink class="text-link" to="/meetings">Geçmiş</RouterLink></div>
      <div v-if="recentMeetings.length" class="history-preview-grid">
        <article v-for="meeting in recentMeetings" :key="meeting.id" class="history-preview">
          <strong>{{ salesStore.customerName(meeting.customerId) }}</strong>
          <span>{{ new Date(meeting.createdAt).toLocaleString("tr-TR") }}</span>
          <small>{{ meeting.insights.length }} içgörü · {{ meeting.wordCount }} kelime</small>
        </article>
      </div>
      <div v-else class="empty-state">Henüz kaydedilmiş toplantı yok. İlk analizi başlatarak geçmişi oluşturabilirsin.</div>
    </section>
  </div>
</template>
