<script setup lang="ts">
import type { CmsInfoSection } from '~/types/cms'

// One section of an information page (#107, #121): an h2 and its blocks, all
// copy from the page's Payload global. `sizeTable`, `contact` and `journal`
// blocks carry no text; they show the product page's size table, the footer
// global's contact details and the journal global's articles.
const { section } = defineProps<{
  section: CmsInfoSection
}>()

// The journal's articles come from Payload; without them the section (an h2
// over nothing) is left out, like the home page's journal section.
const hasJournal = section.blocks.some((block) => block.blockType === 'journal')
const { data: journalSection } = hasJournal
  ? useFetchJournalSection()
  : { data: ref(null) }
const articles = computed(() => journalSection.value?.articles ?? [])
const isVisible = computed(() => !hasJournal || articles.value.length > 0)

const headingId = computed(() => `${section.anchor}-heading`)
</script>

<template>
  <section
    v-if="isVisible"
    :id="section.anchor"
    :aria-labelledby="headingId"
    class="flex scroll-mt-28 flex-col gap-5"
  >
    <AppHeading :id="headingId" as="h2" size="sm">
      {{ section.heading }}
    </AppHeading>

    <template v-for="(block, index) in section.blocks" :key="index">
      <p
        v-if="block.blockType === 'text'"
        class="text-sm leading-[1.8] text-color-muted"
      >
        {{ block.text }}
      </p>

      <!-- A fact the owner still has to supply: neutral wording, set apart
           so a reviewer spots it. -->
      <p
        v-else-if="block.blockType === 'placeholder'"
        class="border-l-2 border-color-accent pl-4 text-sm italic leading-[1.8] text-color-muted"
      >
        {{ block.text }}
      </p>

      <component
        :is="block.ordered ? 'ol' : 'ul'"
        v-else-if="block.blockType === 'list'"
        class="flex flex-col gap-2 pl-5 text-sm leading-[1.8] text-color-muted"
        :class="block.ordered ? 'list-decimal' : 'list-disc'"
      >
        <li
          v-for="(item, itemIndex) in block.items"
          :key="itemIndex"
          class="pl-1"
        >
          {{ item.text }}
        </li>
      </component>

      <AppLinkButton
        v-else-if="block.blockType === 'link'"
        :to="block.to"
        class="self-start"
      >
        {{ block.label }}
      </AppLinkButton>

      <AppSizeTable
        v-else-if="block.blockType === 'sizeTable'"
        :caption="$t('product.sizeGuide.description')"
      />

      <InfoFaq v-else-if="block.blockType === 'faq'" :items="block.items" />

      <InfoContact v-else-if="block.blockType === 'contact'" />

      <div
        v-else-if="block.blockType === 'journal'"
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
