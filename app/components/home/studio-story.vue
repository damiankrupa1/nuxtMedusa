<script setup lang="ts">
const { title } = useAppConfig()

const values = [
  'pages.home.studioStory.valueMade',
  'pages.home.studioStory.valueMaterials',
  'pages.home.studioStory.valueBatches',
]
</script>

<template>
  <section class="flex flex-col items-center gap-10 px-6 py-16 md:flex-row md:gap-20 md:px-16 md:py-24">
    <div class="relative h-[360px] w-full md:h-[528px] md:w-[632px] md:shrink-0">
      <NuxtImg
        src="/images/home/studio-craft.jpg"
        :alt="$t('pages.home.studioStory.imageAlt')"
        width="1152"
        height="928"
        sizes="100vw md:44vw"
        class="size-full object-cover"
        loading="lazy"
      />
      <div class="absolute bottom-6 left-6 flex items-start gap-6 bg-color-paper px-[15px] py-3 text-color-ink">
        <p class="text-[11px]">{{ $t('pages.home.studioStory.signatureLabel', { title }) }}</p>
        <p class="font-serif text-lg italic">{{ $t('pages.home.studioStory.signatureTagline') }}</p>
      </div>
    </div>

    <div class="flex flex-1 flex-col gap-7">
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

      <div class="flex flex-col gap-5 border-y border-color-line py-5 sm:flex-row">
        <div v-for="value in values" :key="value" class="flex flex-1 flex-col gap-2.5">
          <span class="h-px w-[18px] bg-color-accent" />
          <p class="text-[11px] text-color-ink">{{ $t(value) }}</p>
        </div>
      </div>

      <AppLink
        to="/store"
        class="flex items-center gap-4 self-start border-b border-color-ink pb-2 text-[13px] text-color-ink"
      >
        {{ $t('pages.home.studioStory.collectionLink', { title }) }}
        <UIcon name="i-lucide-arrow-up-right" class="size-4" />
      </AppLink>
    </div>
  </section>
</template>
