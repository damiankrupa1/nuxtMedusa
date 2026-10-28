<script setup lang="ts">
const { title } = useAppConfig()

const { data: brands } = useFetchBrands()
</script>

<template>
  <section
    v-if="brands"
    class="flex flex-col gap-8 border-b border-color-line px-6 py-10 md:px-16 md:py-[52px]"
  >
    <div
      class="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <AppSectionIntro :eyebrow="brands.eyebrow" />
      <AppLinkButton :to="brands.viewAllUrl">
        {{ brands.viewAllLabel }}
      </AppLinkButton>
    </div>
    <div
      class="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 text-color-ink"
    >
      <p class="text-2xl font-medium">{{ title }}</p>
      <p v-for="brand in brands.otherBrands" :key="brand" class="text-xl">
        {{ brand }}
      </p>
    </div>
  </section>
</template>
