<script setup lang="ts">
// <html lang> follows the i18n locale, which the region middleware sets from
// the URL's country only (getLocaleFromCountryCode: /pl → pl, any other
// country → en), so it is the same for every visitor of a CDN-cached page
// and updates on client-side navigation to another country.
const { locale } = useI18n()
useHead({ htmlAttrs: { lang: locale } })

useSeoMeta({
  title: 'Fashion',
  description: 'Premium clothing store',
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.1s ease;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
}
</style>
