<script setup>
import { computed, ref } from "vue";
import SummaryGrid from "../components/SummaryGrid.vue";
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
  const labels = { price: "Fiyat / bütçe", timing: "Zamanlama", competitor: "Rakip karşılaştırması", integration: "Entegrasyon", authority: "Karar yetkisi", security: "Güvenlik" };
  const counts = {};
  salesStore.state.meetings.flatMap((meeting) => meeting.insights || []).forEach((item) => { counts[item.id] = (counts[item.id] || 0) + 1; });
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0) || 1;
  return Object.entries(counts).map(([id, value], index) => ({ label: labels[id] || id, value: Math.round(value / total * 100), color: ["#f3b64c", "#5f9c83", "#6897b6", "#a08cbe"][index % 4] })).slice(0, 6);
});
const currency = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", notation: "compact", maximumFractionDigits: 1 });
const expandedPerson = ref(null);
function relatedUser(name) {
  return salesStore.state.users.find((user) => user.name === name);
}
function personLogs(name) {
  return salesStore.state.auditLogs.filter((log) => log.actor.name === name).slice(0, 8);
}
</script>

<template>
  <SummaryGrid :items="[
    { label: 'ANALİZ EDİLEN GÖRÜŞME', value: salesStore.state.meetings.length, hint: 'Yerel toplantı kayıtları' },
    { label: 'ORTALAMA FIRSAT SKORU', value: averageScore, hint: 'Aktif müşteriler' },
    { label: 'KAPANAN SATIŞ', value: wonOffers.length, hint: currency.format(salesStore.wonRevenue.value) },
  ]" />
  <div class="analytics-grid">
    <section class="panel detail-wide">
      <div class="panel-header"><div><p class="eyebrow">PERSONEL PERFORMANSI</p><h3>Satış ve müşteri dönüşleri</h3></div><span class="analytics-total">{{ currency.format(totalSales) }} toplam · %{{ averageResponseRate }} ort. dönüş</span></div>
      <div class="performance-chart" role="img" aria-label="Personel bazında satış tutarı ve müşteri dönüş oranı">
        <div v-for="person in personnelPerformance" :key="person.name" class="performance-record">
          <article class="performance-row clickable-row" @click="expandedPerson = expandedPerson === person.name ? null : person.name">
            <div class="person-cell"><span class="avatar">{{ person.initials }}</span><span><strong>{{ person.name }}</strong><small>{{ person.closedDeals }} kapanan satış</small></span></div>
            <div class="chart-cell"><div class="chart-label"><span>Satış</span><strong>{{ currency.format(person.salesAmount) }}</strong></div><i class="sales-bar"><b :style="{ width: `${person.salesAmount / maxSales * 100}%` }"></b></i></div>
            <div class="response-cell"><strong>%{{ person.leads ? Math.round(person.responses / person.leads * 100) : 0 }}</strong><span>Müşteri dönüşü</span><small>{{ person.responses }}/{{ person.leads }} yanıt</small></div>
          </article>
          <div v-if="expandedPerson === person.name" class="person-drilldown">
            <div class="person-kpis"><span><strong>{{ person.leads }}</strong> Lead</span><span><strong>{{ person.responses }}</strong> Dönüş</span><span><strong>{{ person.closedDeals }}</strong> Satış</span></div>
            <div><h4>Son hareketler</h4><p v-for="log in personLogs(person.name)" :key="log.id"><code>{{ log.action }}</code> · {{ new Date(log.timestamp).toLocaleString("tr-TR") }}</p><p v-if="!personLogs(person.name).length">Henüz hareket kaydı yok.</p></div>
            <button v-if="relatedUser(person.name) && salesStore.can('users')" class="status-button" :class="{ inactive: !relatedUser(person.name).active }" @click.stop="salesStore.toggleUserStatus(relatedUser(person.name).id)">{{ relatedUser(person.name).active ? "Personeli pasife al" : "Personeli aktifleştir" }}</button>
          </div>
        </div>
      </div>
    </section>
    <section class="panel">
      <p class="eyebrow">İTİRAZ ANALİZİ</p><h3>Müşteriler neye takılıyor?</h3>
      <div class="bar-list">
        <div v-for="item in objectionStats" :key="item.label" class="bar-item">
          <div><span>{{ item.label }}</span><strong>%{{ item.value }}</strong></div>
          <i><b :style="{ width: `${item.value * 2.2}%`, background: item.color }"></b></i>
        </div>
      </div>
      <p v-if="!objectionStats.length" class="empty-state">İtiraz analizi için toplantı kaydı gerekiyor.</p>
    </section>
    <section class="panel">
      <p class="eyebrow">AI KOÇ DEĞERLENDİRMESİ</p><h3>Bu ayın satış içgörüleri</h3>
      <div class="coach-note"><span>01</span><p><strong>Fiyatı erken savunuyorsun.</strong>Müşterinin toplam maliyet algısını anlamadan indirime geçme.</p></div>
      <div class="coach-note"><span>02</span><p><strong>Entegrasyon güçlü tarafın.</strong>Son 20 müşterinin 5’i geçiş süresine takıldı. 90 günlük planı daha erken göster.</p></div>
      <div class="coach-note"><span>03</span><p><strong>Karar vericiyi netleştir.</strong>Görüşmelerin %31’inde son onayı verecek kişi belirlenmemiş.</p></div>
    </section>
    <section class="panel detail-wide">
      <p class="eyebrow">SATIŞÇI GELİŞİMİ</p><h3>Görüşme kalitesi</h3>
      <div class="metric-grid circular-metrics"><div v-for="metric in [{ value: 84, label: 'İhtiyaç keşfi' }, { value: 76, label: 'İtiraz yönetimi' }, { value: 68, label: 'Kapanış soruları' }, { value: 91, label: 'Ürün bilgisi' }]" :key="metric.label"><i :style="{ '--metric': metric.value }"><strong>%{{ metric.value }}</strong></i><span>{{ metric.label }}</span></div></div>
    </section>
  </div>
</template>
