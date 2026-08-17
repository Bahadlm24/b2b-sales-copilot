<script setup>
import { t } from "../i18n/localeStore.js";
</script>

<template>
  <section class="panel not-found">
    <span>403</span>
    <h2>{{ t("accessDenied.title") }}</h2>
    <p>{{ t("accessDenied.body") }}</p>
    <RouterLink class="primary-button compact link-button" to="/">{{ t("common.home") }}</RouterLink>
  </section>
</template>
