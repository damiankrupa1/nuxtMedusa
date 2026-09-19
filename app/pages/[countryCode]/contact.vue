<script setup lang="ts">
const { t } = useI18n()

useSeoMeta({
  title: t('pages.contact.title'),
})
</script>

<template>
  <UContainer class="py-12">
    <h1>{{ $t('pages.contact.title') }}</h1>
  </UContainer>
</template>
