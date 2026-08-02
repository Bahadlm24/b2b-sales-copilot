<script setup>
import { computed, reactive, ref } from "vue";
import { salesStore } from "../stores/salesStore";

const filter = ref("Tümü");
const form = reactive({ title: "", customerId: salesStore.customers.find((item) => !item.archived)?.id, dueDate: "", priority: "Orta", ownerId: salesStore.currentUser.value.id });
const editingId = ref(null);
const editForm = reactive({});
const visibleTasks = computed(() => {
  if (filter.value === "Açık") return salesStore.openTasks.value;
  if (filter.value === "Tamamlandı") return salesStore.completedTasks.value;
  return salesStore.state.tasks;
});
const today = new Date().toISOString().slice(0, 10);
function isOverdue(task) {
  return !task.completed && task.dueDate < today;
}
function startEdit(task) {
  editingId.value = task.id;
  Object.assign(editForm, task);
}
function saveEdit() {
  if (salesStore.updateTask(editingId.value, editForm)) editingId.value = null;
}
function overdueDays(task) {
  return Math.max(1, Math.floor((new Date(`${today}T00:00:00`) - new Date(`${task.dueDate}T00:00:00`)) / 86400000));
}

function submitTask() {
  if (!form.title.trim() || !form.dueDate) return;
  salesStore.addTask({ ...form, title: form.title.trim(), customerId: Number(form.customerId) });
  form.title = "";
  form.dueDate = "";
  filter.value = "Tümü";
}
</script>

<template>
  <div class="task-layout">
    <section class="panel">
      <p class="eyebrow">YENİ TAKİP</p><h3>Satış görevi ekle</h3>
      <form class="task-form" @submit.prevent="submitTask">
        <label><span>Görev</span><input v-model="form.title" class="search-input" required placeholder="Örn. Teknik dokümanı gönder" /></label>
        <label><span>Müşteri</span><select v-model="form.customerId" class="select-input"><option v-for="customer in salesStore.customers.filter(x => !x.archived)" :key="customer.id" :value="customer.id">{{ customer.name }}</option></select></label>
        <div class="form-row">
          <label><span>Son tarih</span><input v-model="form.dueDate" class="search-input" type="date" required /></label>
          <label><span>Öncelik</span><select v-model="form.priority" class="select-input"><option>Yüksek</option><option>Orta</option><option>Düşük</option></select></label>
        </div>
        <label><span>Sorumlu</span><select v-model.number="form.ownerId" class="select-input"><option v-for="user in salesStore.state.users.filter(x => x.active)" :key="user.id" :value="user.id">{{ user.name }}</option></select></label>
        <button class="primary-button" type="submit">Takip görevi ekle</button>
      </form>
    </section>
    <section class="panel">
      <div class="panel-header"><div><p class="eyebrow">TAKİP LİSTESİ</p><h3>Görevler</h3></div><select v-model="filter" class="select-input compact-select"><option>Açık</option><option>Tümü</option><option>Tamamlandı</option></select></div>
      <div class="task-list">
        <article v-for="task in visibleTasks" :key="task.id" class="task-item" :class="{ completed: task.completed, overdue: isOverdue(task) }">
          <button class="task-check" :aria-label="task.completed ? 'Görevi yeniden aç' : 'Görevi tamamla'" @click="salesStore.toggleTask(task.id)">{{ task.completed ? "✓" : "" }}</button>
          <div><strong>{{ task.title }}</strong><small>{{ salesStore.customerName(task.customerId) }} · {{ task.dueDate }} · {{ salesStore.userName(task.ownerId) }}</small><em v-if="isOverdue(task)" class="overdue-label">{{ overdueDays(task) }} gün gecikti</em></div>
          <span class="priority-badge" :class="task.priority.toLocaleLowerCase('tr-TR')">{{ task.priority }}</span>
          <select :value="task.status" class="select-input task-status-select" @change="salesStore.updateTaskStatus(task.id, $event.target.value)"><option>Bekliyor</option><option>Devam ediyor</option><option>Tamamlandı</option></select>
          <button class="activity-toggle" @click="startEdit(task)">Düzenle</button>
          <button class="remove-button" aria-label="Görevi sil" @click="salesStore.removeTask(task.id)">×</button>
        </article>
        <form v-if="editingId" class="task-edit-card" @submit.prevent="saveEdit">
          <div class="form-row"><label><span>Başlık</span><input v-model="editForm.title" class="search-input" required /></label><label><span>Son tarih</span><input v-model="editForm.dueDate" class="search-input" type="date" required /></label></div>
          <div class="form-row"><label><span>Öncelik</span><select v-model="editForm.priority" class="select-input"><option>Yüksek</option><option>Orta</option><option>Düşük</option></select></label><label><span>Sorumlu</span><select v-model.number="editForm.ownerId" class="select-input"><option v-for="user in salesStore.state.users.filter(x => x.active)" :key="user.id" :value="user.id">{{ user.name }}</option></select></label></div>
          <div class="record-actions"><button class="primary-button compact">Kaydet</button><button type="button" class="secondary-button" @click="editingId = null">Vazgeç</button></div>
        </form>
        <p v-if="!visibleTasks.length" class="empty-state">Bu filtrede görev bulunmuyor.</p>
      </div>
    </section>
  </div>
</template>
