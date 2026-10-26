<script setup lang="ts">
const { title } = useAppConfig()

// Falls back to the i18n content below when Payload has no JournalSection
// global yet (or is unreachable) — see missing-cms-content skill.
const fallbackArticles = [
  {
    key: 'capsuleWardrobe',
    image: '/images/home/journal-capsule-wardrobe.jpg',
  },
  {
    key: 'merinoWool',
    image: '/images/home/journal-merino-wool.jpg',
  },
  {
    key: 'autumnWalk',
    image: '/images/home/journal-autumn-walk.jpg',
  },
]

const { data: journalSection } = useFetchJournalSection()
const cms = computed(() => journalSection.value ?? null)
</script>

<template>
  <section
    id="journal"
    class="flex flex-col gap-9 bg-color-sand px-6 pb-20 pt-16 md:px-16 md:pt-[72px]"
  >
    <div class="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
      <AppSectionIntro
        :eyebrow="cms?.eyebrow ?? $t('pages.home.journal.eyebrow', { title })"
        :heading="cms?.heading ?? $t('pages.home.journal.heading')"
      />
      <AppLinkButton :to="cms?.viewAllUrl ?? '/store'">
        {{ cms?.viewAllLabel ?? $t('pages.home.journal.viewAll') }}
      </AppLinkButton>
    </div>

    <div v-if="cms" class="grid grid-cols-1 gap-7 sm:grid-cols-3">
      <AppLink
        v-for="article in cms.articles"
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
          <UIcon name="i-lucide-arrow-up-right" class="size-[18px] shrink-0 text-color-ink" />
        </div>
        <p class="text-xs leading-[1.6] text-color-muted">{{ article.summary }}</p>
      </AppLink>
    </div>
    <div v-else class="grid grid-cols-1 gap-7 sm:grid-cols-3">
      <AppLink
        v-for="article in fallbackArticles"
        :key="article.key"
        to="/store"
        class="flex flex-col gap-[17px]"
      >
        <div class="h-[284px] w-full overflow-hidden">
          <NuxtImg
            :src="article.image"
            :alt="$t(`pages.home.journal.${article.key}.imageAlt`)"
            width="1264"
            height="848"
            sizes="100vw sm:33vw"
            class="size-full object-cover"
            loading="lazy"
          />
        </div>
        <div class="flex items-start justify-between text-color-muted">
          <p class="text-[9px]">{{ $t(`pages.home.journal.${article.key}.category`) }}</p>
          <p class="text-[10px]">{{ $t(`pages.home.journal.${article.key}.readingTime`) }}</p>
        </div>
        <div class="flex items-start gap-5">
          <p class="flex-1 font-serif text-[29px] leading-[1.1] text-color-ink">
            {{ $t(`pages.home.journal.${article.key}.title`) }}
          </p>
          <UIcon name="i-lucide-arrow-up-right" class="size-[18px] shrink-0 text-color-ink" />
        </div>
        <p class="text-xs leading-[1.6] text-color-muted">
          {{ $t(`pages.home.journal.${article.key}.summary`) }}
        </p>
      </AppLink>
    </div>
  </section>
</template>
