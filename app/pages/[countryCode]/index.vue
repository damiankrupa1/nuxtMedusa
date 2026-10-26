<script setup lang="ts">
definePageMeta({ cdnCache: true, prefooter: true })

const { t } = useI18n()

useSeoMeta({
  title: t('pages.home.title'),
  ogTitle: t('pages.home.title'),
})
</script>

<template>
  <div>
    <HomeCampaign />
    <HomeCategories />
    <HomeNewArrivals />
    <HomeShopTheLook />
    <HomeBrands />
    <HomeStudioStory />
    <HomeJournal />
  </div>
</template>
