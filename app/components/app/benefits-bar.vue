<script setup lang="ts">
const benefits = [
  { icon: 'i-lucide-truck', key: 'delivery' },
  { icon: 'i-lucide-rotate-ccw', key: 'returns' },
  { icon: 'i-lucide-package-check', key: 'origin' },
  { icon: 'i-lucide-messages-square', key: 'support' },
]
</script>

<template>
  <div
    class="flex flex-col gap-6 border-b border-color-line bg-color-paper px-6 py-8 sm:flex-row sm:gap-6 md:px-16 md:py-[44px]"
  >
    <div
      v-for="benefit in benefits"
      :key="benefit.key"
      class="flex flex-1 items-start gap-3.5"
    >
      <UIcon :name="benefit.icon" class="size-[25px] shrink-0 text-color-ink" />
      <div class="flex flex-col gap-2">
        <p class="text-xs font-medium text-color-ink">
          {{ $t(`app.benefits.${benefit.key}.title`) }}
        </p>
        <p class="text-[10px] leading-[1.6] text-color-muted">
          {{ $t(`app.benefits.${benefit.key}.note`) }}
        </p>
      </div>
    </div>
  </div>
</template>
