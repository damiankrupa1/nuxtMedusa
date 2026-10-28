<script setup lang="ts">
// Curated feature grid, not a raw category listing — card copy/images are
// editorial. Cards whose categoryHandle no longer resolves to a real Medusa
// category are dropped by the CMS service, so every link is a real category.
const { data: categoryTiles } = useFetchCategoryTiles()
</script>

<template>
  <section
    v-if="categoryTiles"
    class="flex flex-col gap-8 px-6 py-16 md:px-16 md:py-[88px]"
  >
    <div
      class="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end"
    >
      <AppSectionIntro
        :eyebrow="categoryTiles.eyebrow"
        :heading="categoryTiles.heading"
      />
      <p class="max-w-[320px] text-[13px] leading-[1.7] text-color-muted">
        {{ categoryTiles.description }}
      </p>
    </div>

    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <AppLink
        v-for="card in categoryTiles.cards"
        :key="card.categoryHandle"
        :to="{
          name: 'countryCode-categories-handle',
          params: { handle: card.categoryHandle },
        }"
        class="flex flex-col gap-[18px]"
      >
        <div class="h-[340px] w-full overflow-hidden">
          <NuxtImg
            :src="card.image.url"
            :alt="card.image.alt"
            sizes="100vw sm:50vw lg:25vw"
            class="size-full object-cover"
            loading="lazy"
          />
        </div>
        <div class="flex items-center justify-between">
          <p class="font-serif text-[28px] text-color-ink">{{ card.title }}</p>
          <UIcon
            name="i-lucide-arrow-up-right"
            class="size-[19px] shrink-0 text-color-ink"
          />
        </div>
        <p class="text-xs text-color-muted">{{ card.subtitle }}</p>
      </AppLink>
    </div>
  </section>
</template>
