<script setup>
import { computed, reactive, ref } from "vue";
import OwnerSelect from "../components/OwnerSelect.vue";
import { formatStatus, t } from "../i18n/localeStore.js";
import { salesStore } from "../stores/salesStore";

const filter = ref("all");
const form = reactive({ title: "", customerId: salesStore.customers.find((item) => !item.archived)?.id, dueDate: "", priority: "Orta", ownerId: salesStore.currentUser.value.id });
const editingId = ref(null);
const editForm = reactive({});
const priorities = ["Yüksek", "Orta", "Düşük"];
const taskStatuses = ["Bekliyor", "Devam ediyor", "Tamamlandı"];
const visibleTasks = computed(() => {
  if (filter.value === "open") return salesStore.openTasks.value;
  if (filter.value === "done") return salesStore.completedTasks.value;
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
function priorityClass(priority) {
  return { Yüksek: "yüksek", Orta: "orta", Düşük: "düşük" }[priority] || "";
}

function submitTask() {
  if (!form.title.trim() || !form.dueDate) return;
  salesStore.addTask({ ...form, title: form.title.trim(), customerId: Number(form.customerId) });
  form.title = "";
  form.dueDate = "";
  filter.value = "all";
}
</script>

<template>
  <div class="task-layout">
    <section class="panel">
      <p class="eyebrow">{{ t("tasks.newEyebrow") }}</p><h3>{{ t("tasks.newTitle") }}</h3>
      <form class="task-form" @submit.prevent="submitTask">
        <label><span>{{ t("tasks.title") }}</span><input v-model="form.title" class="search-input" required :placeholder="t('tasks.titlePh')" /></label>
        <label><span>{{ t("tasks.customer") }}</span><select v-model="form.customerId" class="select-input"><option v-for="customer in salesStore.customers.filter(x => !x.archived)" :key="customer.id" :value="customer.id">{{ customer.name }}</option></select></label>
        <div class="form-row">
          <label><span>{{ t("tasks.due") }}</span><input v-model="form.dueDate" class="search-input" type="date" required /></label>
          <label><span>{{ t("tasks.priority") }}</span><select v-model="form.priority" class="select-input"><option v-for="item in priorities" :key="item" :value="item">{{ formatStatus(item) }}</option></select></label>
        </div>
        <label><span>{{ t("common.owner") }}</span><OwnerSelect v-model="form.ownerId" /></label>
        <button class="primary-button" type="submit">{{ t("tasks.add") }}</button>
      </form>
    </section>
    <section class="panel">
      <div class="panel-header"><div><p class="eyebrow">{{ t("tasks.listEyebrow") }}</p><h3>{{ t("tasks.listTitle") }}</h3></div><select v-model="filter" class="select-input compact-select"><option value="open">{{ t("tasks.open") }}</option><option value="all">{{ t("common.all") }}</option><option value="done">{{ t("tasks.done") }}</option></select></div>
      <div class="task-list">
        <article v-for="task in visibleTasks" :key="task.id" class="task-item" :class="{ completed: task.completed, overdue: isOverdue(task) }">
          <button class="task-check" :aria-label="task.completed ? t('tasks.reopen') : t('tasks.complete')" @click="salesStore.toggleTask(task.id)">{{ task.completed ? "✓" : "" }}</button>
          <div><strong>{{ task.title }}</strong><small>{{ salesStore.customerName(task.customerId) }} · {{ task.dueDate }} · {{ salesStore.userName(task.ownerId) }}</small><em v-if="isOverdue(task)" class="overdue-label">{{ t("tasks.overdue", { days: overdueDays(task) }) }}</em></div>
          <span class="priority-badge" :class="priorityClass(task.priority)">{{ formatStatus(task.priority) }}</span>
          <select :value="task.status" class="select-input task-status-select" @change="salesStore.updateTaskStatus(task.id, $event.target.value)"><option v-for="item in taskStatuses" :key="item" :value="item">{{ formatStatus(item) }}</option></select>
          <button class="activity-toggle" @click="startEdit(task)">{{ t("common.edit") }}</button>
          <button class="remove-button" :aria-label="t('tasks.remove')" @click="salesStore.removeTask(task.id)">×</button>
        </article>
        <form v-if="editingId" class="task-edit-card" @submit.prevent="saveEdit">
          <div class="form-row"><label><span>{{ t("tasks.editTitle") }}</span><input v-model="editForm.title" class="search-input" required /></label><label><span>{{ t("tasks.due") }}</span><input v-model="editForm.dueDate" class="search-input" type="date" required /></label></div>
          <div class="form-row"><label><span>{{ t("tasks.priority") }}</span><select v-model="editForm.priority" class="select-input"><option v-for="item in priorities" :key="item" :value="item">{{ formatStatus(item) }}</option></select></label><label><span>{{ t("common.owner") }}</span><OwnerSelect v-model="editForm.ownerId" /></label></div>
          <div class="record-actions"><button class="primary-button compact">{{ t("common.save") }}</button><button type="button" class="secondary-button" @click="editingId = null">{{ t("common.cancel") }}</button></div>
        </form>
        <p v-if="!visibleTasks.length" class="empty-state">{{ t("tasks.empty") }}</p>
      </div>
    </section>
  </div>
</template>
