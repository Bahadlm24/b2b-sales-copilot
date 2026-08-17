<script setup>
import { locale, t, toggleLocale } from "../i18n/localeStore.js";
</script>

<template>
  <button
    class="theme-toggle"
    type="button"
    :aria-label="t('common.language')"
    :title="t('common.language')"
    @click="toggleLocale"
  >
    {{ locale === "tr" ? "TR" : "EN" }}
  </button>
</template>
