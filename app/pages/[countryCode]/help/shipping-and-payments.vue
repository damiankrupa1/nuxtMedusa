<script setup lang="ts">
// Information page (#107): route, status and sections in INFO_PAGES
// (app/utils/info-pages.ts), copy in i18n under `pages.shippingAndPayments`.
definePageMeta({ cdnCache: true, prefooter: true })

useInfoPageSeo('shippingAndPayments')
</script>

<template>
  <InfoPage id="shippingAndPayments" />
</template>
