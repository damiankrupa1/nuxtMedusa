<script setup lang="ts">
definePageMeta({ cdnCache: true, prefooter: true })

const { t } = useI18n()

useSeoMeta({
  title: t('pages.store.title'),
  ogTitle: t('pages.store.title'),
})
</script>

<template>
  <StoreCatalog :title="$t('pages.store.title')" />
</template>
