<script setup lang="ts">
import type { InfoPageId } from '~/types/info-page'
import { getInfoPage } from '~/utils/info-pages'

// The shared layout of the information pages (#107): breadcrumb, the h1
// intro, an optional table of contents and the sections. No design exists
// for these screens; spacing follows the wishlist and store pages.
const { id } = defineProps<{
  id: InfoPageId
}>()

const page = computed(() => getInfoPage(id))

// The closing "Any questions?" block needs the Payload contact details and
// is left out without them, like the footer's contact block.
const { data: footerContent } = useFetchFooterContent()
const showContact = computed(
  () => !!page.value.contact && !!footerContent.value?.contact,
)
</script>

<template>
  <div>
    <UContainer class="pt-[26px]">
      <nav
        :aria-label="$t('pages.info.breadcrumb')"
        class="flex flex-wrap items-center gap-2.5 text-[10px] text-color-muted"
      >
        <AppLink to="/">{{ $t('app.header.home') }}</AppLink>
        <span aria-hidden="true">/</span>
        <span>{{ $t(`pages.info.groups.${page.group}`) }}</span>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{{ $t(`pages.${page.id}.title`) }}</span>
      </nav>

      <AppSectionIntro
        as="h1"
        size="lg"
        :eyebrow="$t(`pages.${page.id}.eyebrow`)"
        :heading="$t(`pages.${page.id}.heading`)"
        class="max-w-[720px] pb-10 pt-8"
      >
        {{ $t(`pages.${page.id}.lead`) }}
      </AppSectionIntro>
    </UContainer>

    <UContainer class="pb-16">
      <div
        class="flex flex-col gap-10 border-t border-color-line pt-10 lg:flex-row lg:gap-16"
      >
        <nav
          v-if="page.toc"
          :aria-label="$t('pages.info.toc')"
          class="lg:sticky lg:top-28 lg:w-[220px] lg:shrink-0 lg:self-start"
        >
          <p class="pb-3 text-[10px] text-color-muted">
            {{ $t('pages.info.toc') }}
          </p>
          <ul class="flex flex-col gap-2 text-[13px] leading-[1.6]">
            <li v-for="section in page.sections" :key="section.id">
              <a
                :href="`#${section.id}`"
                class="text-color-ink underline-offset-2 outline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-(--color-ink)"
              >
                {{ $t(`pages.${page.id}.sections.${section.id}.heading`) }}
              </a>
            </li>
          </ul>
        </nav>

        <div class="flex min-w-0 max-w-[720px] flex-1 flex-col gap-12">
          <InfoSection
            v-for="section in page.sections"
            :key="section.id"
            :page="page"
            :section="section"
          />

          <section
            v-if="showContact"
            id="contact"
            aria-labelledby="contact-heading"
            class="flex scroll-mt-28 flex-col gap-5 bg-color-sand p-6 md:p-8"
          >
            <AppHeading id="contact-heading" as="h2" size="sm">
              {{ $t('pages.info.contact.heading') }}
            </AppHeading>
            <p class="text-sm leading-[1.8] text-color-muted">
              {{ $t('pages.info.contact.text') }}
            </p>
            <InfoContact />
          </section>
        </div>
      </div>
    </UContainer>
  </div>
</template>
