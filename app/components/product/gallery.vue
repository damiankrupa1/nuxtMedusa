<script setup lang="ts">
import type { StoreProduct } from '@medusajs/types'

const { product } = defineProps<{
  product: StoreProduct
}>()

// A product may come from a list payload without `images`: its thumbnail is
// then the only picture.
const images = computed(() => {
  const urls = (product.images ?? []).map((image) => image.url)
  if (!urls.length && product.thumbnail) urls.push(product.thumbnail)
  return urls
})

const activeIndex = ref(0)
const activeImage = computed(() => images.value[activeIndex.value])

const pad = (value: number) => String(value).padStart(2, '0')

// TODO(#58): mock. Derived from `created_at`; Medusa has no "new" flag
// (damiankrupa1/medusaDemo#25). TODO(#59): confirm the 30-day threshold.
const showBadge = computed(() => isNewProduct(product))

// TODO(#58): the gallery does not follow the selected color: Medusa images are
// not tied to variants or colors (damiankrupa1/medusaDemo#25).
</script>

<template>
  <div class="flex flex-col gap-5 md:flex-row">
    <ul
      v-if="images.length > 1"
      class="order-2 flex gap-3 md:order-1 md:w-[110px] md:shrink-0 md:flex-col md:gap-3.5"
      :aria-label="$t('product.gallery.thumbnails')"
    >
      <li v-for="(url, index) in images" :key="url" class="w-[72px] md:w-full">
        <button
          type="button"
          class="relative block aspect-[110/138] w-full cursor-pointer overflow-hidden border p-[3px] outline-offset-2 focus-visible:outline-2 focus-visible:outline-(--color-ink)"
          :class="
            index === activeIndex ? 'border-color-accent' : 'border-transparent'
          "
          :aria-label="
            $t('product.gallery.show', {
              index: index + 1,
              count: images.length,
            })
          "
          :aria-pressed="index === activeIndex"
          @click="activeIndex = index"
        >
          <NuxtImg
            :src="url"
            alt=""
            sizes="110px"
            class="size-full object-cover"
          />
        </button>
      </li>
    </ul>

    <div class="order-1 flex min-w-0 flex-1 flex-col gap-3.5 md:order-2">
      <div
        class="relative aspect-[638/796] w-full overflow-hidden bg-color-sand"
      >
        <NuxtImg
          v-if="activeImage"
          :src="activeImage"
          :alt="product.title"
          sizes="100vw md:50vw"
          class="size-full object-cover"
        />
        <span
          v-if="showBadge"
          class="absolute left-5 top-5 bg-color-paper px-3 py-[7px] text-[9px] uppercase leading-[1.5] tracking-[0.05em] text-color-ink"
        >
          {{ $t('product.gallery.new') }}
        </span>
      </div>
      <div class="flex gap-3.5">
        <p
          v-if="images.length > 1"
          class="w-[100px] shrink-0 text-[10px] leading-[1.5] text-color-muted"
          aria-hidden="true"
        >
          {{ pad(activeIndex + 1) }} / {{ pad(images.length) }}
        </p>
        <!--
          TODO(#58): mock. Medusa images have no caption (damiankrupa1/medusaDemo#25),
          so the product title stands in for it.
        -->
        <p class="text-[11px] leading-[1.5] text-color-muted">
          {{ product.title }}
        </p>
      </div>
    </div>
  </div>
</template>
