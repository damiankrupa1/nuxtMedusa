<script setup lang="ts"></script>

<template>
  <div
    class="h-[100vh] w-full flex flex-col justify-center items-center text-center relative"
  >
    <NuxtImg
      src="/images/hero/people.jpg"
      :alt="$t('store.hero.imageAlt')"
      width="1920"
      height="1080"
      class="h-full w-full object-cover"
      preload
      fetchpriority="high"
    />
    <div
      class="absolute top-0 left-0 w-full h-full bg-black/50 flex flex-col justify-center items-center text-center gap-y-4 px-4"
    >
      <h1 class="text-3xl leading-10 tracking-tight text-white">
        {{ $t('store.hero.tagline') }}
      </h1>
    </div>
    <!-- TODO: Update link -->
    <AppButtonPrimary
      to="/store"
      block
      class="mt-30 absolute max-w-[500px] bg-transparent"
      variant="outline"
    >
      {{ $t('store.hero.cta') }}
    </AppButtonPrimary>
  </div>
</template>
