<script setup lang="ts">
const { t } = useI18n()

useSeoMeta({
  title: t('pages.home.title'),
  ogTitle: t('pages.home.title'),
})
</script>

<template>
  <div>
    <StoreHero />
    <LazyCollectionList />
  </div>
</template>
