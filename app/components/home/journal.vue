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
      <AppJournalCard
        v-for="article in journalSection.articles"
        :key="article.title"
        :article="article"
      />
    </div>
  </section>
</template>
