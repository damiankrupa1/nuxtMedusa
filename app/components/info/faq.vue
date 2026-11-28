<script setup lang="ts">
import type { FaqEntry } from '~/types/info-page'

// Questions as a disclosure list on native <details>/<summary>: the browser
// gives every question a tab stop, Enter and Space open and close it, and
// screen readers announce it as expanded/collapsed, without any script.
// The answer stays in the DOM (and in the server render) while closed.
defineProps<{
  items: FaqEntry[]
}>()
</script>

<template>
  <div class="flex flex-col border-t border-color-line">
    <details
      v-for="item in items"
      :key="item.question"
      class="group border-b border-color-line"
    >
      <summary
        class="flex cursor-pointer list-none items-start justify-between gap-6 py-4 text-sm leading-[1.6] text-color-ink outline-offset-2 focus-visible:outline-2 focus-visible:outline-(--color-ink) [&::-webkit-details-marker]:hidden"
      >
        <span>{{ item.question }}</span>
        <UIcon
          name="i-lucide-plus"
          class="mt-0.5 size-4 shrink-0 transition-transform duration-150 group-open:rotate-45 motion-reduce:transition-none"
          aria-hidden="true"
        />
      </summary>
      <p class="pb-5 pr-10 text-[13px] leading-[1.7] text-color-muted">
        {{ item.answer }}
      </p>
    </details>
  </div>
</template>
