<script setup>
import { computed } from "vue";
import { salesStore } from "../stores/salesStore";

defineProps({
  modelValue: { type: [Number, String], default: null },
});
const emit = defineEmits(["update:modelValue"]);
const users = computed(() => salesStore.activeUsers.value);
</script>

<template>
  <select
    class="select-input"
    :value="modelValue"
    @change="emit('update:modelValue', Number($event.target.value))"
  >
    <option v-for="user in users" :key="user.id" :value="user.id">{{ user.name }}</option>
  </select>
</template>
