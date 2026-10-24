<script setup lang="ts">
const { title } = useAppConfig()

// "Dla niego" links to the men's department, same source as the header's
// AppHeaderDepartments — falls back to /store if unavailable.
const { men } = await useDepartmentCategories()
const secondaryDepartmentLink = computed(() =>
  men.value ? `/categories/${men.value.handle}` : '/store',
)
</script>

<template>
  <section class="flex flex-col lg:flex-row lg:h-[676px]">
    <div
      class="flex flex-col justify-between gap-10 bg-color-sand px-6 py-10 lg:w-[610px] lg:shrink-0 lg:px-16 lg:py-[54px]"
    >
      <div class="flex items-start justify-between text-[10px]">
        <p class="text-color-ink">{{ $t('pages.home.campaign.seasonLabel') }}</p>
        <p class="text-color-muted">{{ $t('pages.home.campaign.editionLabel') }}</p>
      </div>

      <div class="flex flex-col gap-6 lg:gap-[26px]">
        <h1 class="font-serif text-5xl leading-[0.94] text-color-ink sm:text-6xl lg:text-[88px]">
          <span class="block">{{ $t('pages.home.campaign.headlineLine1') }}</span>
          <span class="block">{{ $t('pages.home.campaign.headlineLine2') }}</span>
        </h1>
        <p class="max-w-[370px] text-sm leading-[1.7] text-color-muted">
          {{ $t('pages.home.campaign.description') }}
        </p>
        <div class="flex items-center gap-6">
          <AppLink
            to="/store"
            class="flex h-12 items-center gap-7 bg-color-ink px-6 text-xs font-medium text-color-paper"
          >
            {{ $t('pages.home.campaign.shopCta') }}
            <UIcon name="i-lucide-arrow-right" class="size-[18px]" />
          </AppLink>
          <AppLink
            :to="secondaryDepartmentLink"
            class="flex items-center gap-4 border-b border-color-ink pb-2 text-[13px] text-color-ink"
          >
            {{ $t('pages.home.campaign.secondaryCta') }}
            <UIcon name="i-lucide-arrow-up-right" class="size-4" />
          </AppLink>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <div class="flex items-center gap-[13px] text-[10px]">
          <p class="text-color-ink">01</p>
          <span class="h-px w-[70px] bg-color-ink" />
          <span class="h-px w-[30px] bg-[#dcd4c7]" />
          <p class="text-color-muted">03</p>
        </div>
        <p class="font-serif text-lg italic text-color-muted">
          {{ $t('pages.home.campaign.tagline') }}
        </p>
      </div>
    </div>

    <div class="relative min-h-[420px] flex-1 lg:min-h-0">
      <NuxtImg
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
          <p class="text-[10px]">{{ $t('pages.home.campaign.captionEyebrow') }}</p>
          <p class="font-serif text-xl">{{ $t('pages.home.campaign.captionHeadline') }}</p>
        </div>
        <UIcon name="i-lucide-arrow-up-right" class="size-5 shrink-0 text-color-ink" />
      </div>
      <p
        class="absolute right-6 top-7 hidden text-[10px] text-color-ink sm:block"
      >
        {{ title }} / {{ new Date().getFullYear() }}
      </p>
    </div>
  </section>
</template>
