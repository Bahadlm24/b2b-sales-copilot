<script setup>
import { computed, reactive } from "vue";
import { useRoute, useRouter } from "vue-router";
import ActivityTimeline from "../components/ActivityTimeline.vue";
import { salesStore } from "../stores/salesStore";

const route = useRoute();
const router = useRouter();
const feedback = reactive({ message: "", error: false });
const lead = computed(() => salesStore.state.leads.find((item) => item.id === Number(route.params.id)));
const form = reactive(lead.value ? { ...lead.value } : {});
const statuses = ["Yeni", "İletişime geçildi", "Nitelikli", "Uygun değil"];
function saveLead() {
  if (form.status === "Uygun değil" && !form.disqualificationReason?.trim()) {
    feedback.message = "Uygun değil durumunda neden zorunludur.";
    feedback.error = true;
    return;
  }
  const ok = salesStore.updateLead(lead.value.id, form);
  feedback.message = ok ? "Lead bilgileri güncellendi." : "Lead güncellenemedi.";
  feedback.error = !ok;
}
function convertLead() {
  const result = salesStore.convertLeadToCustomer(lead.value.id);
  if (!result.ok) {
    feedback.message = result.message;
    feedback.error = true;
    return;
  }
  router.push(`/customers/${result.customer.id}`);
}
</script>

<template>
  <template v-if="lead">
    <RouterLink class="back-link" to="/leads">← Lead havuzuna dön</RouterLink>
    <section class="detail-hero">
      <span class="company-logo large">{{ (lead.name || "L").split(" ").map((part) => part[0]).slice(0, 2).join("") }}</span>
      <div class="customer-main"><div class="title-row"><h2>{{ lead.name || "İsimsiz lead" }}</h2><span class="stage-badge">{{ lead.status }}</span></div><p>{{ lead.company || "Firma belirtilmedi" }} · {{ lead.source }}</p></div>
      <div class="detail-actions"><span class="score-pill">{{ lead.score }}</span><button class="secondary-button" @click="salesStore.archiveLead(lead.id, !lead.archived)">{{ lead.archived ? "Aktifleştir" : "Arşivle" }}</button><button v-if="!lead.convertedCustomerId && !lead.archived" class="primary-button compact" @click="convertLead">Müşteriye dönüştür</button><RouterLink v-else-if="lead.convertedCustomerId" class="secondary-button link-button" :to="`/customers/${lead.convertedCustomerId}`">Müşteri kartını aç</RouterLink></div>
    </section>
    <div class="detail-grid">
      <section class="panel">
        <p class="eyebrow">LEAD BİLGİLERİ</p><h3>Kaydı güncelle</h3>
        <form class="task-form" @submit.prevent="saveLead">
          <div class="form-row"><label><span>Ad soyad</span><input v-model="form.name" class="search-input" /></label><label><span>Firma</span><input v-model="form.company" class="search-input" /></label></div>
          <div class="form-row"><label><span>Telefon</span><input v-model="form.phone" class="search-input" required /></label><label><span>E-posta</span><input v-model="form.email" class="search-input" type="email" /></label></div>
          <div class="form-row"><label><span>Durum</span><select v-model="form.status" class="select-input"><option v-for="status in statuses" :key="status">{{ status }}</option></select></label><label><span>Sorumlu</span><select v-model.number="form.ownerId" class="select-input"><option v-for="user in salesStore.state.users.filter(x => x.active)" :key="user.id" :value="user.id">{{ user.name }}</option></select></label></div>
          <label><span>Skor: {{ form.score }}</span><input v-model="form.score" class="range-input" type="range" min="0" max="100" /></label>
          <label v-if="form.status === 'Uygun değil'"><span>Uygun değil nedeni *</span><textarea v-model="form.disqualificationReason" class="compact-textarea" required /></label>
          <button class="primary-button" type="submit">Lead bilgilerini kaydet</button>
        </form>
      </section>
      <p v-if="feedback.message" class="form-feedback" :class="{ error: feedback.error }">{{ feedback.message }}</p>
      <section class="panel">
        <p class="eyebrow">KAYNAK BİLGİSİ</p><h3>Edinim özeti</h3>
        <dl class="detail-list"><div><dt>Kaynak</dt><dd>{{ lead.source }}</dd></div><div><dt>Kampanya</dt><dd>{{ lead.campaign || "—" }}</dd></div><div><dt>Oluşturulma</dt><dd>{{ new Date(lead.createdAt).toLocaleString("tr-TR") }}</dd></div><div><dt>Son senkronizasyon</dt><dd>{{ lead.lastSyncedAt ? new Date(lead.lastSyncedAt).toLocaleString("tr-TR") : "—" }}</dd></div></dl>
      </section>
      <section class="panel detail-wide"><ActivityTimeline entity-type="lead" :entity-id="lead.id" /></section>
    </div>
  </template>
  <section v-else class="panel not-found"><span>404</span><h2>Lead bulunamadı.</h2><RouterLink class="primary-button compact link-button" to="/leads">Lead havuzuna dön</RouterLink></section>
</template>
