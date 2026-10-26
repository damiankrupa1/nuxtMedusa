<script setup lang="ts">
const { title } = useAppConfig()

// "Dla niego" links to the men's department, same source as the header's
// AppHeaderDepartments — falls back to /store if unavailable. This is real
// commerce routing, so it applies to the CMS and fallback copy alike —
// Payload only supplies the CTA label, never this URL.
const { men } = await useDepartmentCategories()
const secondaryDepartmentLink = computed(() =>
  men.value ? `/categories/${men.value.handle}` : '/store',
)

// Falls back to the single static slide below when Payload has no
// CampaignSlides global yet (or is unreachable) — see missing-cms-content
// skill.
const { data: campaignSlides } = useFetchCampaignSlides()
const slides = computed(() => campaignSlides.value?.slides ?? null)
const activeIndex = ref(0)
const activeSlide = computed(() => slides.value?.[activeIndex.value] ?? null)

watch(slides, () => {
  activeIndex.value = 0
})
</script>

<template>
  <section class="flex flex-col lg:flex-row lg:h-[676px]">
    <div
      class="flex flex-col justify-between gap-10 bg-color-sand px-6 py-10 lg:w-[610px] lg:shrink-0 lg:px-16 lg:py-[54px]"
    >
      <div class="flex items-start justify-between text-[10px]">
        <p class="text-color-ink">
          {{
            activeSlide?.seasonLabel ?? $t('pages.home.campaign.seasonLabel')
          }}
        </p>
        <p class="text-color-muted">
          {{
            activeSlide?.editionLabel ?? $t('pages.home.campaign.editionLabel')
          }}
        </p>
      </div>

      <div class="flex flex-col gap-6 lg:gap-[26px]">
        <AppHeading as="h1" variant="display" size="hero">
          <span class="block">{{
            activeSlide?.headlineLine1 ??
            $t('pages.home.campaign.headlineLine1')
          }}</span>
          <span class="block">{{
            activeSlide?.headlineLine2 ??
            $t('pages.home.campaign.headlineLine2')
          }}</span>
        </AppHeading>
        <p class="max-w-[370px] text-sm leading-[1.7] text-color-muted">
          {{
            activeSlide?.description ?? $t('pages.home.campaign.description')
          }}
        </p>
        <div class="flex items-center gap-6">
          <AppButtonPrimary to="/store" trailing-icon="i-lucide-arrow-right">
            {{ activeSlide?.shopCtaLabel ?? $t('pages.home.campaign.shopCta') }}
          </AppButtonPrimary>
          <AppLinkButton :to="secondaryDepartmentLink">
            {{
              activeSlide?.secondaryCtaLabel ??
              $t('pages.home.campaign.secondaryCta')
            }}
          </AppLinkButton>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <div
          v-if="slides?.length"
          class="flex items-center gap-[13px] text-[10px]"
        >
          <p class="text-color-ink">
            {{ String(activeIndex + 1).padStart(2, '0') }}
          </p>
          <button
            v-for="(slide, index) in slides"
            :key="index"
            type="button"
            class="h-px"
            :class="
              index === activeIndex
                ? 'w-[70px] bg-color-ink'
                : 'w-[30px] bg-color-stone'
            "
            :aria-label="`Slide ${index + 1}`"
            @click="activeIndex = index"
          />
          <p class="text-color-muted">
            {{ String(slides.length).padStart(2, '0') }}
          </p>
        </div>
        <div v-else class="flex items-center gap-[13px] text-[10px]">
          <p class="text-color-ink">01</p>
          <span class="h-px w-[70px] bg-color-ink" />
          <span class="h-px w-[30px] bg-color-stone" />
          <p class="text-color-muted">03</p>
        </div>
        <p class="font-serif text-lg italic text-color-muted">
          {{ activeSlide?.tagline ?? $t('pages.home.campaign.tagline') }}
        </p>
      </div>
    </div>

    <div class="relative min-h-[420px] flex-1 lg:min-h-0">
      <NuxtImg
        v-if="activeSlide"
        :src="activeSlide.image.url"
        :alt="activeSlide.image.alt"
        sizes="100vw lg:60vw"
        class="size-full object-cover"
        loading="lazy"
      />
      <NuxtImg
        v-else
        src="/images/home/autumn-campaign.jpg"
        :alt="$t('pages.home.campaign.imageAlt')"
        width="1152"
        height="928"
        sizes="100vw lg:60vw"
        class="size-full object-cover"
        loading="lazy"
      />
      <div
        class="absolute bottom-7 left-[30px] flex items-center gap-[30px] bg-color-paper px-4 py-3"
      >
        <div class="flex flex-col gap-1 text-color-ink">
          <p class="text-[10px]">
            {{
              activeSlide?.captionEyebrow ??
              $t('pages.home.campaign.captionEyebrow')
            }}
          </p>
          <p class="font-serif text-xl">
            {{
              activeSlide?.captionHeadline ??
              $t('pages.home.campaign.captionHeadline')
            }}
          </p>
        </div>
        <UIcon
          name="i-lucide-arrow-up-right"
          class="size-5 shrink-0 text-color-ink"
        />
      </div>
      <p
        class="absolute right-6 top-7 hidden text-[10px] text-color-ink sm:block"
      >
        {{ title }} / {{ new Date().getFullYear() }}
      </p>
    </div>
  </section>
</template>
