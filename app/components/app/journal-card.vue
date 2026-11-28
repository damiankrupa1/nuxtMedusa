<script setup lang="ts">
import type { CmsJournalArticle } from '~/types/cms'

// One article of the Payload journal global, on the home page's journal
// section and on the journal page (/journal).
defineProps<{
  article: CmsJournalArticle
}>()
</script>

<template>
  <AppLink :to="article.url" class="flex flex-col gap-[17px]">
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
</template>
