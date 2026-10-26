<script setup lang="ts">
const { title } = useAppConfig()

// Falls back to the i18n content below when Payload has no StudioStory
// global yet (or is unreachable) — see missing-cms-content skill.
const fallbackValueKeys = [
  'pages.home.studioStory.valueMade',
  'pages.home.studioStory.valueMaterials',
  'pages.home.studioStory.valueBatches',
]

const { data: studioStory } = useFetchStudioStory()
const cms = computed(() => studioStory.value ?? null)
</script>

<template>
  <section class="flex flex-col items-center gap-10 px-6 py-16 md:flex-row md:gap-20 md:px-16 md:py-24">
    <div class="relative h-[360px] w-full md:h-[528px] md:w-[632px] md:shrink-0">
      <NuxtImg
        v-if="cms"
        :src="cms.image.url"
        :alt="cms.image.alt"
        sizes="100vw md:44vw"
        class="size-full object-cover"
        loading="lazy"
      />
      <NuxtImg
        v-else
        src="/images/home/studio-craft.jpg"
        :alt="$t('pages.home.studioStory.imageAlt')"
        width="1152"
        height="928"
        sizes="100vw md:44vw"
        class="size-full object-cover"
        loading="lazy"
      />
      <div class="absolute bottom-6 left-6 flex items-start gap-6 bg-color-paper px-[15px] py-3 text-color-ink">
        <template v-if="cms">
          <p class="text-[11px]">{{ cms.signatureLabel }}</p>
          <p class="font-serif text-lg italic">{{ cms.signatureTagline }}</p>
        </template>
        <template v-else>
          <p class="text-[11px]">{{ $t('pages.home.studioStory.signatureLabel', { title }) }}</p>
          <p class="font-serif text-lg italic">{{ $t('pages.home.studioStory.signatureTagline') }}</p>
        </template>
      </div>
    </div>

    <div class="flex flex-1 flex-col gap-7">
      <template v-if="cms">
        <p class="text-[10px] text-color-muted">{{ cms.eyebrow }}</p>
        <h2 class="font-serif text-4xl leading-none text-color-ink md:text-[56px]">
          <span class="block">{{ cms.headlineLine1 }}</span>
          <span class="block">{{ cms.headlineLine2 }}</span>
        </h2>
        <p class="text-sm leading-[1.8] text-color-muted">{{ cms.paragraph1 }}</p>
        <p class="text-sm leading-[1.8] text-color-muted">{{ cms.paragraph2 }}</p>
      </template>
      <template v-else>
        <p class="text-[10px] text-color-muted">
          {{ $t('pages.home.studioStory.eyebrow', { title }) }}
        </p>
        <h2 class="font-serif text-4xl leading-none text-color-ink md:text-[56px]">
          <span class="block">{{ $t('pages.home.studioStory.headlineLine1') }}</span>
          <span class="block">{{ $t('pages.home.studioStory.headlineLine2') }}</span>
        </h2>
        <p class="text-sm leading-[1.8] text-color-muted">
          {{ $t('pages.home.studioStory.paragraph1', { title }) }}
        </p>
        <p class="text-sm leading-[1.8] text-color-muted">
          {{ $t('pages.home.studioStory.paragraph2') }}
        </p>
      </template>

      <div class="flex flex-col gap-5 border-y border-color-line py-5 sm:flex-row">
        <template v-if="cms">
          <div v-for="value in cms.values" :key="value" class="flex flex-1 flex-col gap-2.5">
            <span class="h-px w-[18px] bg-color-accent" />
            <p class="text-[11px] text-color-ink">{{ value }}</p>
          </div>
        </template>
        <template v-else>
          <div v-for="value in fallbackValueKeys" :key="value" class="flex flex-1 flex-col gap-2.5">
            <span class="h-px w-[18px] bg-color-accent" />
            <p class="text-[11px] text-color-ink">{{ $t(value) }}</p>
          </div>
        </template>
      </div>

      <AppLink
        :to="cms?.collectionUrl ?? '/store'"
        class="flex items-center gap-4 self-start border-b border-color-ink pb-2 text-[13px] text-color-ink"
      >
        {{ cms?.collectionLinkLabel ?? $t('pages.home.studioStory.collectionLink', { title }) }}
        <UIcon name="i-lucide-arrow-up-right" class="size-4" />
      </AppLink>
    </div>
  </section>
</template>
