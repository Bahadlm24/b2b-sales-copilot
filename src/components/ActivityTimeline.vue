<script setup>
import { computed, ref } from "vue";
import { formatDate, t } from "../i18n/localeStore.js";
import { salesStore } from "../stores/salesStore";

const props = defineProps({
  entityType: { type: String, required: true },
  entityId: { type: [String, Number], required: true },
  compact: { type: Boolean, default: false },
});

const noteTitle = ref("");
const noteDescription = ref("");
const activities = computed(() => salesStore.activitiesFor(props.entityType, props.entityId));
const icons = { meeting: "◫", task: "✓", status: "↗", lead: "+", call: "☎", offer: "◇", note: "✎" };

function addNote() {
  if (!noteTitle.value.trim()) return;
  salesStore.addActivity(props.entityType, props.entityId, noteTitle.value.trim(), noteDescription.value.trim());
  noteTitle.value = "";
  noteDescription.value = "";
}
</script>

<template>
  <section class="activity-timeline" :class="{ compact }">
    <div class="activity-header"><div><p class="eyebrow">{{ t("activity.eyebrow") }}</p><h3>{{ t("activity.title") }}</h3></div><span class="count-badge">{{ activities.length }}</span></div>
    <form class="activity-note-form" @submit.prevent="addNote">
      <input v-model="noteTitle" class="search-input" :placeholder="t('activity.titlePh')" required />
      <input v-model="noteDescription" class="search-input" :placeholder="t('activity.descPh')" />
      <button class="primary-button compact" type="submit">{{ t("activity.add") }}</button>
    </form>
    <div class="timeline-list">
      <article v-for="activity in activities" :key="activity.id" class="timeline-item">
        <span class="timeline-icon">{{ icons[activity.type] || "•" }}</span>
        <div><strong>{{ activity.title }}</strong><p v-if="activity.description">{{ activity.description }}</p><small>{{ activity.actorName }} · {{ formatDate(activity.createdAt) }}</small></div>
      </article>
      <p v-if="!activities.length" class="empty-state">{{ t("activity.empty") }}</p>
    </div>
  </section>
</template>
