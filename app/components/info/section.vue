<script setup lang="ts">
import type {
  FaqEntry,
  InfoBlock,
  InfoPage as InfoPageData,
  InfoSection as InfoSectionData,
} from '~/types/info-page'
import { toFaqKeys, toInfoSectionKey } from '~/utils/info-pages'

// One section of an information page: an h2 and its blocks, all copy from
// `pages.<page>.sections.<section>.*` (see INFO_PAGES).
const { page, section } = defineProps<{
  page: InfoPageData
  section: InfoSectionData
}>()

const { t } = useI18n()

const base = computed(() => toInfoSectionKey(page, section))
const key = (relative: string) => `${base.value}.${relative}`

const listItems = (block: Extract<InfoBlock, { kind: 'list' }>) =>
  Array.from({ length: block.items }, (_, index) =>
    t(key(`${block.key}.${index + 1}`)),
  )

const faqItems = (block: Extract<InfoBlock, { kind: 'faq' }>): FaqEntry[] =>
  toFaqKeys(base.value, block).map((entry) => ({
    question: t(entry.question),
    answer: t(entry.answer),
  }))

// The journal's articles come from Payload; without them the section (an h2
// over nothing) is left out, like the home page's journal section.
const hasJournal = section.blocks.some((block) => block.kind === 'journal')
const { data: journalSection } = hasJournal
  ? useFetchJournalSection()
  : { data: ref(null) }
const articles = computed(() => journalSection.value?.articles ?? [])
const isVisible = computed(() => !hasJournal || articles.value.length > 0)

const headingId = computed(() => `${section.id}-heading`)
</script>

<template>
  <section
    v-if="isVisible"
    :id="section.id"
    :aria-labelledby="headingId"
    class="flex scroll-mt-28 flex-col gap-5"
  >
    <AppHeading :id="headingId" as="h2" size="sm">
      {{ $t(key('heading')) }}
    </AppHeading>

    <template v-for="(block, index) in section.blocks" :key="index">
      <p
        v-if="block.kind === 'text'"
        class="text-sm leading-[1.8] text-color-muted"
      >
        {{ $t(key(block.key)) }}
      </p>

      <!-- A fact the owner still has to supply: neutral wording, set apart
           so a reviewer spots it. TODO(owner) marks it in INFO_PAGES. -->
      <p
        v-else-if="block.kind === 'placeholder'"
        class="border-l-2 border-color-accent pl-4 text-sm italic leading-[1.8] text-color-muted"
      >
        {{ $t(key(block.key)) }}
      </p>

      <component
        :is="block.ordered ? 'ol' : 'ul'"
        v-else-if="block.kind === 'list'"
        class="flex flex-col gap-2 pl-5 text-sm leading-[1.8] text-color-muted"
        :class="block.ordered ? 'list-decimal' : 'list-disc'"
      >
        <li v-for="item in listItems(block)" :key="item" class="pl-1">
          {{ item }}
        </li>
      </component>

      <AppLinkButton
        v-else-if="block.kind === 'link'"
        :to="block.to"
        class="self-start"
      >
        {{ $t(key(block.key)) }}
      </AppLinkButton>

      <AppSizeTable
        v-else-if="block.kind === 'sizeTable'"
        :caption="$t('product.sizeGuide.description')"
      />

      <InfoFaq v-else-if="block.kind === 'faq'" :items="faqItems(block)" />

      <InfoContact v-else-if="block.kind === 'contact'" />

      <div
        v-else-if="block.kind === 'journal'"
        class="grid grid-cols-1 gap-7 sm:grid-cols-2"
      >
        <AppJournalCard
          v-for="article in articles"
          :key="article.title"
          :article="article"
        />
      </div>
    </template>
  </section>
</template>
