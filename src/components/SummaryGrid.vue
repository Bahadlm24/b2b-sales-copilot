<script setup>
defineProps({
  items: { type: Array, required: true },
  extraClass: { type: String, default: "" },
});
</script>

<template>
  <section class="summary-grid" :class="extraClass">
    <article v-for="item in items" :key="item.label" class="summary-card">
      <small>{{ item.label }}</small>
      <strong>{{ item.value }}</strong>
      <span>{{ item.hint }}</span>
    </article>
  </section>
</template>
