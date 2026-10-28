<script setup lang="ts">
const { data: studioStory } = useFetchStudioStory()
</script>

<template>
  <section
    v-if="studioStory"
    class="flex flex-col items-center gap-10 px-6 py-16 md:flex-row md:gap-20 md:px-16 md:py-24"
  >
    <div
      class="relative h-[360px] w-full md:h-[528px] md:w-[632px] md:shrink-0"
    >
      <NuxtImg
        :src="studioStory.image.url"
        :alt="studioStory.image.alt"
        sizes="100vw md:44vw"
        class="size-full object-cover"
        loading="lazy"
      />
      <div
        class="absolute bottom-6 left-6 flex items-start gap-6 bg-color-paper px-[15px] py-3 text-color-ink"
      >
        <p class="text-[11px]">{{ studioStory.signatureLabel }}</p>
        <p class="font-serif text-lg italic">
          {{ studioStory.signatureTagline }}
        </p>
      </div>
    </div>

    <div class="flex flex-1 flex-col gap-7">
      <AppSectionIntro :eyebrow="studioStory.eyebrow" size="lg">
        <template #heading>
          <span class="block">{{ studioStory.headlineLine1 }}</span>
          <span class="block">{{ studioStory.headlineLine2 }}</span>
        </template>
      </AppSectionIntro>
      <p class="text-sm leading-[1.8] text-color-muted">
        {{ studioStory.paragraph1 }}
      </p>
      <p class="text-sm leading-[1.8] text-color-muted">
        {{ studioStory.paragraph2 }}
      </p>

      <div
        class="flex flex-col gap-5 border-y border-color-line py-5 sm:flex-row"
      >
        <div
          v-for="value in studioStory.values"
          :key="value"
          class="flex flex-1 flex-col gap-2.5"
        >
          <span class="h-px w-[18px] bg-color-accent" />
          <p class="text-[11px] text-color-ink">{{ value }}</p>
        </div>
      </div>

      <AppLinkButton :to="studioStory.collectionUrl" class="self-start">
        {{ studioStory.collectionLinkLabel }}
      </AppLinkButton>
    </div>
  </section>
</template>
