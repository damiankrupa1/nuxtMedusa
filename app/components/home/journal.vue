<script setup lang="ts">
const { data: journalSection } = useFetchJournalSection()
</script>

<template>
  <section
    v-if="journalSection"
    id="journal"
    class="flex flex-col gap-9 bg-color-sand px-6 pb-20 pt-16 md:px-16 md:pt-[72px]"
  >
    <div
      class="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end"
    >
      <AppSectionIntro
        :eyebrow="journalSection.eyebrow"
        :heading="journalSection.heading"
      />
      <AppLinkButton :to="journalSection.viewAllUrl">
        {{ journalSection.viewAllLabel }}
      </AppLinkButton>
    </div>

    <div class="grid grid-cols-1 gap-7 sm:grid-cols-3">
      <AppLink
        v-for="article in journalSection.articles"
        :key="article.title"
        :to="article.url"
        class="flex flex-col gap-[17px]"
      >
        <div class="h-[284px] w-full overflow-hidden">
          <NuxtImg
            :src="article.image.url"
            :alt="article.image.alt"
            sizes="100vw sm:33vw"
            class="size-full object-cover"
            loading="lazy"
          />
        </div>
        <div class="flex items-start justify-between text-color-muted">
          <p class="text-[9px]">{{ article.category }}</p>
          <p class="text-[10px]">{{ article.readingTime }}</p>
        </div>
        <div class="flex items-start gap-5">
          <p class="flex-1 font-serif text-[29px] leading-[1.1] text-color-ink">
            {{ article.title }}
          </p>
          <UIcon
            name="i-lucide-arrow-up-right"
            class="size-[18px] shrink-0 text-color-ink"
          />
        </div>
        <p class="text-xs leading-[1.6] text-color-muted">
          {{ article.summary }}
        </p>
      </AppLink>
    </div>
  </section>
</template>
