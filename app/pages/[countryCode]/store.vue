<script setup lang="ts">
definePageMeta({ cdnCache: true })

const { t } = useI18n()

useSeoMeta({
  title: t('pages.store.title'),
  ogTitle: t('pages.store.title'),
})
</script>

<template>
  <div>
    <StoreCatalog :title="$t('pages.store.title')" />
    <AppBenefitsBar />
    <AppNewsletter />
  </div>
</template>
