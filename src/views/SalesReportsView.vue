<script setup>
import { computed, reactive } from "vue";
import { salesStore } from "../stores/salesStore";
import { buildSalesReport } from "../services/salesReporting";

const filters = reactive({ from: "", to: "", ownerId: "all", source: "all" });
const report = computed(() => buildSalesReport(salesStore.state, filters));
const sources = computed(() => [...new Set(salesStore.state.leads.map((item) => item.source))]);
const currency = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
const maxFunnel = computed(() => Math.max(1, ...report.value.funnel.map((item) => item.value)));
const maxPersonnelRevenue = computed(() => Math.max(1, ...report.value.personnel.map((item) => item.revenue)));
function resetFilters() { Object.assign(filters, { from: "", to: "", ownerId: "all", source: "all" }); }
</script>

<template>
  <section class="panel report-filters"><div><p class="eyebrow">RAPOR FİLTRELERİ</p><h3>Satış sonuçlarını incele</h3></div><label><span>Başlangıç</span><input v-model="filters.from" class="search-input" type="date" /></label><label><span>Bitiş</span><input v-model="filters.to" class="search-input" type="date" /></label><label><span>Personel</span><select v-model="filters.ownerId" class="select-input"><option value="all">Tüm personel</option><option v-for="user in salesStore.state.users" :key="user.id" :value="user.id">{{ user.name }}</option></select></label><label><span>Kaynak</span><select v-model="filters.source" class="select-input"><option value="all">Tüm kaynaklar</option><option v-for="source in sources" :key="source">{{ source }}</option></select></label><button class="secondary-button" @click="resetFilters">Temizle</button></section>

  <section class="report-kpis">
    <article><small>TOPLAM DATA</small><strong>{{ report.totals.leads }}</strong><span>{{ report.totals.active }} aktif · {{ report.totals.passive }} pasif</span></article>
    <article><small>DÖNÜŞ YAPAN</small><strong>%{{ report.totals.responseRate }}</strong><span>{{ report.totals.responded }} kayıt yanıt verdi</span></article>
    <article><small>MÜŞTERİ OLAN</small><strong>{{ report.totals.converted }}</strong><span>%{{ report.totals.conversionRate }} dönüşüm</span></article>
    <article><small>KAZANILAN SATIŞ</small><strong>{{ report.totals.wonDeals }}</strong><span>%{{ report.totals.winRate }} kapanış</span></article>
    <article class="revenue-kpi"><small>TOPLAM KAZANÇ</small><strong>{{ currency.format(report.totals.revenue) }}</strong><span>{{ currency.format(report.totals.pipeline) }} açık pipeline</span></article>
    <article><small>GÖRÜŞME KALİTESİ</small><strong>{{ report.totals.averageMeetingScore || '—' }}</strong><span>{{ report.totals.meetings }} analiz edilen görüşme</span></article>
  </section>

  <div class="report-grid">
    <section class="panel"><div class="panel-header"><div><p class="eyebrow">DÖNÜŞÜM DİYAGRAMI</p><h3>Data’dan satışa akış</h3></div></div><div class="funnel-chart"><article v-for="item in report.funnel" :key="item.label"><div><span>{{ item.label }}</span><strong>{{ item.value }}</strong></div><i><b :style="{ width: `${item.value / maxFunnel * 100}%` }"></b></i></article></div></section>
    <section class="panel"><div class="panel-header"><div><p class="eyebrow">DATA DURUMU</p><h3>Aktiflik ve sonuç dağılımı</h3></div></div><div class="status-distribution"><article><strong>{{ report.totals.active }}</strong><span>Aktif takip</span></article><article><strong>{{ report.totals.passive }}</strong><span>Pasif/arşiv</span></article><article><strong>{{ report.totals.uninterested }}</strong><span>İlgilenmiyor</span></article><article><strong>{{ report.totals.positive }}</strong><span>Olumlu görüşme</span></article><article><strong>{{ report.totals.negative }}</strong><span>Olumsuz görüşme</span></article><article><strong>{{ report.totals.customers }}</strong><span>Aktif müşteri</span></article></div></section>
    <section class="panel report-wide"><div class="panel-header"><div><p class="eyebrow">PERSONEL SONUÇLARI</p><h3>Satış, dönüş ve görüşme performansı</h3></div></div><div class="sheet-scroll"><table class="report-table"><thead><tr><th>Personel</th><th>Data</th><th>Dönüş</th><th>Müşteri</th><th>Görüşme</th><th>Ort. skor</th><th>Satış</th><th>Kazanç</th></tr></thead><tbody><tr v-for="person in report.personnel" :key="person.id"><td><strong>{{ person.name }}</strong></td><td>{{ person.leads }}</td><td>{{ person.responses }}</td><td>{{ person.conversions }}</td><td>{{ person.meetings }}</td><td>{{ person.averageScore || '—' }}</td><td>{{ person.wonDeals }}</td><td><strong>{{ currency.format(person.revenue) }}</strong><i class="mini-revenue"><b :style="{ width: `${person.revenue / maxPersonnelRevenue * 100}%` }"></b></i></td></tr></tbody></table></div></section>
    <section class="panel report-wide"><div class="panel-header"><div><p class="eyebrow">KANAL PERFORMANSI</p><h3>Lead kaynaklarının dönüşümü</h3></div></div><div class="source-cards"><article v-for="item in report.sourcePerformance" :key="item.source"><strong>{{ item.source }}</strong><span>{{ item.leads }} data</span><span>{{ item.responses }} dönüş</span><span>{{ item.conversions }} müşteri</span><b>%{{ item.rate }}</b></article><p v-if="!report.sourcePerformance.length" class="empty-state">Filtreye uygun kaynak verisi bulunamadı.</p></div></section>
  </div>
</template>
