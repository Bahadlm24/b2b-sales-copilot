<script setup>
import { computed, reactive, ref } from "vue";
import { salesStore } from "../stores/salesStore";

const filters = reactive({ search: "", status: "Tümü", owner: "all", entityType: "all" });
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
  const name = salesStore.journeyEntityName(item).toLocaleLowerCase("tr-TR");
  return (filters.status === "Tümü" || item.status === filters.status)
    && (filters.owner === "all" || item.ownerId === Number(filters.owner))
    && (filters.entityType === "all" || item.entityType === filters.entityType)
    && name.includes(filters.search.toLocaleLowerCase("tr-TR"));
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
  feedback.value = result.message || "Görüşme takibi oluşturuldu ve sorumlu personele bildirildi.";
  if (result.ok) Object.assign(form, { entityId: "", scheduledAt: "", notes: "" });
}
function edit(item) {
  editingId.value = item.id;
  Object.assign(draft, { status: item.status, scheduledAt: item.scheduledAt, result: item.result || "", notes: item.notes || "", ownerId: item.ownerId });
}
function save(item) {
  const result = salesStore.updateMeetingJourney(item.id, draft);
  feedback.value = result.message || "Toplantı akışı güncellendi ve bildirim oluşturuldu.";
  if (result.ok && draft.status === "Olumlu" && item.entityType === "lead") {
    const conversion = salesStore.convertLeadToCustomer(item.entityId);
    if (conversion.ok) {
      salesStore.linkJourneyToCustomer(item.id, conversion.customer.id);
      feedback.value = `${conversion.customer.name} aktif müşteriye dönüştürüldü; görüşme geçmişi korundu.`;
    } else feedback.value = conversion.message;
  }
  if (result.ok) editingId.value = null;
}
const formatDate = (value) => value ? new Date(value).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" }) : "—";
</script>

<template>
  <section class="tracker-summary">
    <article><small>PLANLANAN</small><strong>{{ summary.planned }}</strong><span>Yaklaşan görüşmeler</span></article>
    <article><small>GÖRÜŞME SAĞLANDI</small><strong>{{ summary.held }}</strong><span>Sonuç bekleyenler</span></article>
    <article><small>KARAR AŞAMASI</small><strong>{{ summary.decision }}</strong><span>Yakın takip</span></article>
    <article><small>SONUÇLANAN</small><strong>{{ summary.closed }}</strong><span>Olumlu / olumsuz</span></article>
  </section>

  <section class="panel tracker-flow">
    <div class="panel-header"><div><p class="eyebrow">SATIŞ YOLCULUĞU</p><h3>Lead’den aktif müşteriye görüşme döngüsü</h3></div></div>
    <div class="flow-diagram">
      <span>Lead</span><b>→</b><span>Planlandı</span><b>→</b><span>Görüşme sağlandı</span><b>↻</b><span>Yeni toplantı</span><b>→</b><span>Karar</span><b>→</b><span class="positive">Aktif müşteri</span><span class="negative">Olumsuz</span>
    </div>
  </section>

  <section class="panel tracker-create">
    <div class="panel-header"><div><p class="eyebrow">YENİ TAKİP</p><h3>Müşteri görüşmesi planla</h3></div></div>
    <form class="tracker-form" @submit.prevent="createJourney">
      <label><span>Kayıt tipi</span><select v-model="form.entityType" class="select-input" @change="resetEntity"><option value="lead">Potansiyel müşteri</option><option value="customer">Müşteri</option></select></label>
      <label><span>Firma / kişi *</span><select v-model.number="form.entityId" class="select-input" required><option value="">Seçin</option><option v-for="item in entities" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
      <label><span>Toplantı tarihi *</span><input v-model="form.scheduledAt" class="search-input" type="datetime-local" required /></label>
      <label><span>Sorumlu</span><select v-model.number="form.ownerId" class="select-input"><option v-for="user in salesStore.state.users.filter(x => x.active)" :key="user.id" :value="user.id">{{ user.name }}</option></select></label>
      <label class="tracker-notes"><span>Gündem / not</span><input v-model="form.notes" class="search-input" placeholder="Görüşmenin amacı" /></label>
      <button class="primary-button compact">Planla</button>
    </form>
    <p v-if="feedback" class="form-feedback">{{ feedback }}</p>
  </section>

  <section class="panel tracker-sheet">
    <div class="list-toolbar tracker-toolbar"><div><p class="eyebrow">TOPLANTI TAKİP TABLOSU</p><h3>Dinamik görüşme akışı</h3></div><input v-model="filters.search" class="search-input" placeholder="Firma ara..." /><select v-model="filters.status" class="select-input"><option>Tümü</option><option v-for="status in statuses" :key="status">{{ status }}</option></select><select v-model="filters.owner" class="select-input"><option value="all">Tüm personel</option><option v-for="user in salesStore.state.users" :key="user.id" :value="user.id">{{ user.name }}</option></select></div>
    <div class="sheet-scroll">
      <table class="meeting-sheet"><thead><tr><th>Firma</th><th>Tip</th><th>Tur</th><th>Durum</th><th>Toplantı tarihi</th><th>Sorumlu</th><th>Sonuç / not</th><th>İşlem</th></tr></thead>
        <tbody><tr v-for="item in rows" :key="item.id">
          <td><strong>{{ salesStore.journeyEntityName(item) }}</strong><small>{{ item.entityType === 'lead' ? 'Potansiyel müşteri' : 'Aktif müşteri' }}</small></td>
          <td><span class="sheet-type">{{ item.entityType === "lead" ? "LEAD" : "MÜŞTERİ" }}</span></td><td><b>{{ item.round }}. görüşme</b></td>
          <template v-if="editingId === item.id">
            <td><select v-model="draft.status" class="select-input"><option v-for="status in statuses" :key="status">{{ status }}</option></select></td>
            <td><input v-model="draft.scheduledAt" class="search-input" type="datetime-local" /></td>
            <td><select v-model.number="draft.ownerId" class="select-input"><option v-for="user in salesStore.state.users" :key="user.id" :value="user.id">{{ user.name }}</option></select></td>
            <td><input v-model="draft.result" class="search-input" placeholder="Sonuç / sonraki adım" /></td>
            <td><button class="primary-button compact" @click="save(item)">Kaydet</button><button class="text-link" @click="editingId = null">Vazgeç</button></td>
          </template>
          <template v-else>
            <td><span class="journey-status" :class="item.status === 'Olumlu' ? 'success' : item.status === 'Olumsuz' ? 'danger' : ''">{{ item.status }}</span><i class="journey-progress" :class="{ success: item.status === 'Olumlu', danger: item.status === 'Olumsuz' }"><b :style="{ width: `${progressFor(item.status)}%` }"></b></i></td>
            <td>{{ formatDate(item.scheduledAt) }}</td><td>{{ salesStore.userName(item.ownerId) }}</td><td><span>{{ item.result || item.notes || "—" }}</span><small>{{ item.history?.length || 1 }} hareket</small></td><td><button class="secondary-button" @click="edit(item)">Güncelle</button></td>
          </template>
        </tr><tr v-if="!rows.length"><td colspan="8" class="empty-state">Filtreye uygun takip kaydı bulunamadı.</td></tr></tbody>
      </table>
    </div>
  </section>
</template>
