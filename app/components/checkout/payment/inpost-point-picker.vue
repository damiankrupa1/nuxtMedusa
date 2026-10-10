<script setup lang="ts">
interface InpostPoint {
  name: string
  address_details?: {
    street?: string
    building_number?: string
    city?: string
    post_code?: string
  }
}

const emit = defineEmits<{
  select: [point: InpostPoint]
}>()

const config = useRuntimeConfig()
const host = ref<HTMLDivElement | null>(null)
const selectedPoint = ref<InpostPoint | null>(null)
const error = ref('')

let widget: HTMLElement | null = null
let disposed = false

function loadStylesheet() {
  if (document.querySelector('[data-inpost-geowidget-css]')) return

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = 'https://geowidget.inpost.pl/inpost-geowidget.css'
  link.dataset.inpostGeowidgetCss = 'true'
  document.head.appendChild(link)
}

function loadGeowidgetScript(): Promise<void> {
  if (customElements.get('inpost-geowidget')) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    let script = document.querySelector<HTMLScriptElement>(
      '[data-inpost-geowidget-script]',
    )

    if (script) {
      script.addEventListener('load', () => resolve(), { once: true })
      script.addEventListener(
        'error',
        () => reject(new Error('Nie udało się załadować mapy InPost.')),
        { once: true },
      )

      if (customElements.get('inpost-geowidget')) resolve()
      return
    }

    script = document.createElement('script')
    script.src = 'https://geowidget.inpost.pl/inpost-geowidget.js'
    script.dataset.inpostGeowidgetScript = 'true'
    script.async = true

    script.onload = () => resolve()
    script.onerror = () =>
      reject(new Error('Nie udało się załadować mapy InPost.'))

    document.head.appendChild(script)
  })
}

onMounted(async () => {
  const token = config.public.inpostGeowidgetToken

  if (!token) {
    error.value = 'Brak tokenu Geowidget InPost.'
    return
  }

  try {
    loadStylesheet()
    await loadGeowidgetScript()

    if (disposed || !host.value) return

    widget = document.createElement('inpost-geowidget')
    widget.setAttribute('token', String(token))
    widget.setAttribute('language', 'pl')
    widget.setAttribute('config', 'parcelCollect')

    widget.addEventListener('inpost.geowidget.init', (event) => {
      const api = (
        event as CustomEvent<{
          api: {
            addPointSelectedCallback: (
              callback: (point: InpostPoint) => void,
            ) => void
          }
        }>
      ).detail.api

      api.addPointSelectedCallback((point) => {
        if (disposed) return

        selectedPoint.value = point
        emit('select', point)
      })
    })

    host.value.appendChild(widget)
  } catch (cause) {
    error.value =
      cause instanceof Error
        ? cause.message
        : 'Wystąpił błąd podczas uruchamiania mapy.'
  }
})

onBeforeUnmount(() => {
  disposed = true
  widget?.remove()
  widget = null
})

function clearSelection() {
  selectedPoint.value = null
  emit('select', null as unknown as InpostPoint)
}
</script>

<template>
  <section class="inpost-picker">
    <p v-if="error" class="mb-3 text-sm text-red-600">
      {{ error }}
    </p>

    <div ref="host" class="inpost-map" />

    <div
      v-if="selectedPoint"
      class="mt-4 rounded-lg border p-4"
      aria-live="polite"
    >
      <p class="font-semibold">Wybrany punkt: {{ selectedPoint.name }}</p>

      <p class="mt-1 text-sm text-gray-600">
        {{
          [
            selectedPoint.address_details?.street,
            selectedPoint.address_details?.building_number,
          ]
            .filter(Boolean)
            .join(' ')
        }}
      </p>

      <p class="text-sm text-gray-600">
        {{
          [
            selectedPoint.address_details?.post_code,
            selectedPoint.address_details?.city,
          ]
            .filter(Boolean)
            .join(' ')
        }}
      </p>

      <button
        type="button"
        class="mt-3 text-sm underline"
        @click="clearSelection"
      >
        Wybierz inny punkt
      </button>
    </div>
  </section>
</template>

<style scoped>
.inpost-map {
  width: 100%;
  min-height: 480px;
}

.inpost-map :deep(inpost-geowidget) {
  display: block;
  width: 100%;
  height: 480px;
}
</style>
