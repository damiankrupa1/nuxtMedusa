<script setup lang="ts">
import { PREVIEW_STATUS } from '~/types/preview'

// The draft preview's notice (#53). Rendered only while the preview is on,
// which is never during the server render or the hydration (usePreview() is
// `off` until app/plugins/preview.client.ts starts it), so a CDN-cached page
// is the same with or without it. No design exists for it; it uses the
// accent tone to stand apart from the ink announcement bar below it.
const { state, exit } = usePreview()
const { t, locale } = useI18n()

const message = computed(() => {
  if (state.value.status === PREVIEW_STATUS.active) {
    const time = new Intl.DateTimeFormat(locale.value, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(state.value.expiresAt))
    return t('app.preview.active', { time })
  }
  return t('app.preview.expired')
})
</script>

<template>
  <aside
    v-if="state.status !== PREVIEW_STATUS.off"
    :aria-label="t('app.preview.label')"
    class="bg-color-accent text-color-paper"
  >
    <div
      class="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-2 text-xs md:px-16"
    >
      <!-- Stays mounted while the preview is on, so the switch from active
           to expired is announced -->
      <p role="status">{{ message }}</p>
      <button
        type="button"
        class="shrink-0 cursor-pointer border border-current px-3 py-1 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-paper)"
        @click="exit"
      >
        {{ t('app.preview.exit') }}
      </button>
    </div>
  </aside>
</template>
