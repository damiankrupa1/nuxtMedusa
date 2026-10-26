<script setup lang="ts">
import type { InpostPoint, InpostGeowidgetInitDetail  } from '~/types/inpost'

const emit = defineEmits<{
  select: [point: InpostPoint]
}>()

const geowidgetTag = 'inpost-geowidget'
const geowidgetScriptUrl = 'https://geowidget.inpost.pl/inpost-geowidget.js'

useHead({
  link: [
    {
      rel: 'stylesheet',
      href: 'https://geowidget.inpost.pl/inpost-geowidget.css',
    },
  ],
})

const config = useRuntimeConfig()
const { t, locale } = useI18n()

const mapContainer = ref<HTMLDivElement | null>(null)
const loading = ref(true)
const error = ref('')

function appendGeowidgetScript(): HTMLScriptElement {
  const script = document.createElement('script')
  script.src = geowidgetScriptUrl
  script.async = true
  document.head.appendChild(script)
  return script
}

function loadGeowidgetScript(): Promise<void> {
  if (customElements.get(geowidgetTag)) return Promise.resolve()

  return new Promise((resolve, reject) => {
    // Another picker may already be loading the script; share its load.
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${geowidgetScriptUrl}"]`,
    )
    const script = existing ?? appendGeowidgetScript()

    script.addEventListener('load', () => resolve(), { once: true })
    script.addEventListener(
      'error',
      () => {
        // Drop the failed tag so the next mount can retry the download.
        script.remove()
        reject(new Error(`Failed to load ${geowidgetScriptUrl}`))
      },
      { once: true },
    )
  })
}

function createGeowidget(token: string): HTMLElement {
  const widget = document.createElement(geowidgetTag)
  widget.setAttribute('token', token)
  widget.setAttribute('language', locale.value)
  widget.setAttribute('config', 'parcelCollect')

  widget.addEventListener('inpost.geowidget.init', (event) => {
    const { api } = (event as CustomEvent<InpostGeowidgetInitDetail>).detail

    api.addPointSelectedCallback((point) => emit('select', point))
  })

  return widget
}

onMounted(async () => {
  const token = config.public.inpostGeowidgetToken

  if (!token) {
    error.value = t('checkout.delivery.inpost.missingToken')
    loading.value = false
    return
  }

  try {
    await loadGeowidgetScript()

    // Template refs are cleared on unmount, so skip if the picker was closed.
    if (!mapContainer.value) return

    mapContainer.value.appendChild(createGeowidget(token))
  } catch (cause) {
    captureError(cause, { source: 'inpost' })
    error.value = t('checkout.delivery.inpost.loadFailed')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <UAlert
    v-if="error"
    color="error"
    variant="soft"
    icon="i-lucide-alert-circle"
    :title="error"
  />
  <div v-else class="relative">
    <div ref="mapContainer" class="inpost-map" />
    <div
      v-if="loading"
      class="absolute inset-0 flex items-center justify-center"
    >
      <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin" />
    </div>
  </div>
</template>

<style scoped>
.inpost-map {
  width: 100%;
  height: 480px;
}

.inpost-map :deep(inpost-geowidget) {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
