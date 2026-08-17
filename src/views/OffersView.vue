<script setup>
import { computed, reactive, ref } from "vue";
import OwnerSelect from "../components/OwnerSelect.vue";
import SummaryGrid from "../components/SummaryGrid.vue";
import { salesStore } from "../stores/salesStore";
const status = ref("Tümü");
const showArchived = ref(false);
const offers = salesStore.state.offers;
const visibleOffers = computed(() => offers.filter((offer) => Boolean(offer.archived) === showArchived.value));
const filtered = computed(() => status.value === "Tümü" ? visibleOffers.value : visibleOffers.value.filter(x => x.status === status.value));
const total = computed(() => salesStore.activeOffers.value.reduce((sum, x) => sum + x.numericAmount, 0).toLocaleString("tr-TR"));
const averageProbability = computed(() => Math.round(salesStore.activeOffers.value.reduce((sum, item) => sum + item.probability, 0) / salesStore.activeOffers.value.length || 0));
const feedback = ref("");
const form = reactive({ customerId: salesStore.customers.find((item) => !item.archived)?.id, title: "", numericAmount: "", validUntil: "", probability: 50, ownerId: salesStore.currentUser.value.id });
function submitOffer() {
  const result = salesStore.addOffer(form);
  feedback.value = result.message || `${result.offer.no} oluşturuldu.`;
  if (result.ok) Object.assign(form, { customerId: salesStore.customers.find((item) => !item.archived)?.id, title: "", numericAmount: "", validUntil: "", probability: 50, ownerId: salesStore.currentUser.value.id });
}
</script>

<template>
  <SummaryGrid :items="[
    { label: 'AÇIK TEKLİF', value: salesStore.activeOffers.value.length, hint: 'Aktif satış süreci' },
    { label: 'TOPLAM TUTAR', value: `₺${total}`, hint: 'Açık teklif değeri' },
    { label: 'ORTALAMA OLASILIK', value: `%${averageProbability}`, hint: 'Açık teklifler' },
  ]" />
  <section class="panel offer-create-panel">
    <div class="panel-header"><div><p class="eyebrow">YENİ SATIŞ FIRSATI</p><h3>Teklif oluştur</h3></div></div>
    <form class="task-form" @submit.prevent="submitOffer">
      <div class="form-row"><label><span>Müşteri *</span><select v-model.number="form.customerId" class="select-input" required><option v-for="customer in salesStore.customers.filter(x => !x.archived)" :key="customer.id" :value="customer.id">{{ customer.name }}</option></select></label><label><span>Teklif başlığı *</span><input v-model="form.title" class="search-input" required /></label></div>
      <div class="form-row"><label><span>Tutar (₺) *</span><input v-model.number="form.numericAmount" class="search-input" type="number" min="1" required /></label><label><span>Geçerlilik tarihi *</span><input v-model="form.validUntil" class="search-input" type="date" required /></label></div>
      <div class="form-row"><label><span>Sorumlu personel</span><OwnerSelect v-model="form.ownerId" /></label><label><span>Başarı olasılığı: %{{ form.probability }}</span><input v-model.number="form.probability" class="range-input" type="range" min="0" max="100" /></label></div>
      <button class="primary-button" type="submit">Teklif oluştur</button>
      <p v-if="feedback" class="form-feedback" role="status">{{ feedback }}</p>
    </form>
  </section>
  <section class="panel table-panel">
    <div class="list-toolbar">
      <div><p class="eyebrow">TEKLİF HAVUZU</p><h3>Teklifler</h3></div>
      <div class="toolbar-actions"><button class="secondary-button" @click="showArchived = !showArchived">{{ showArchived ? "Aktif kayıtlar" : "Arşiv" }}</button><select v-model="status" class="select-input"><option>Tümü</option><option>Beklemede</option><option>Revize</option><option>Karar</option><option>Hazırlanıyor</option><option>Kazanıldı</option><option>Kaybedildi</option><option>İptal</option></select></div>
    </div>
    <div class="offer-table">
      <div class="table-head"><span>Teklif</span><span>Müşteri</span><span>Tutar</span><span>Olasılık</span><span>Durum</span></div>
      <RouterLink v-for="offer in filtered" :key="offer.id" class="table-row offer-row-link" :to="`/offers/${offer.id}`">
        <span><strong>{{ offer.title }}</strong><small>{{ offer.no }}</small></span><span>{{ offer.customer }}</span><span><strong>{{ offer.amount }}</strong></span>
        <span><i class="progress"><b :style="{ width: `${offer.probability}%` }"></b></i>%{{ offer.probability }}</span><span class="offer-status">{{ offer.status }}</span>
      </RouterLink>
    </div>
  </section>
</template>
