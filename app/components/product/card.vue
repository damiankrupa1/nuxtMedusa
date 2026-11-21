<script setup lang="ts">
import type { StoreProduct } from '@medusajs/types'

const { product, badge, withSaveIcon } = defineProps<{
  product?: StoreProduct
  // Uniform label for a curated section (e.g. "New") — Medusa products have
  // no per-item badge/tag field, see missing-medusa-api-data skill.
  badge?: string
  // Shows the heart that saves the product in the browser's wishlist.
  withSaveIcon?: boolean
}>()

const cheapestVariant = computed(() => getCheapestVariant(product))

const currentPrice = computed(
  () => cheapestVariant.value?.calculated_price?.calculated_amount ?? null,
)
const originalPrice = computed(
  () => cheapestVariant.value?.calculated_price?.original_amount ?? null,
)
const currencyCode = computed(
  () => cheapestVariant.value?.calculated_price?.currency_code ?? null,
)

const colorOption = computed(() => product?.options?.find(isColorOption))

// The server render and the hydration see an empty list (useWishlist), so the
// heart is empty there and the client fills it in once the list is read.
const wishlist = useWishlist()
const isSaved = computed(() => (product ? wishlist.has(product.id) : false))
</script>

<template>
  <!--
    The link and the heart are siblings: a button inside a link is invalid HTML
    and unreliable for keyboards and screen readers. The image is the first
    thing in the link, so the heart, positioned over the card's top right
    corner, sits on the image.
  -->
  <div class="group relative">
    <AppLink
      :to="
        product?.handle
          ? {
              name: 'countryCode-products-handle',
              params: { handle: product.handle },
            }
          : undefined
      "
    >
      <div
        v-if="product"
        class="rounded-lg bg-color-muted relative overflow-hidden border border-color-muted group-hover:shadow transition-shadow ease-in-out duration-150 aspect-[11/14] w-full"
      >
        <NuxtImg
          v-if="product?.thumbnail"
          :src="product.thumbnail || undefined"
          :alt="product?.title"
          sizes="50vw sm:33vw md:25vw"
          class="object-cover object-center w-full h-full"
        />
        <span
          v-if="badge"
          class="absolute left-3.5 top-3.5 bg-color-paper px-2.5 py-1.5 text-[10px] text-color-ink"
        >
          {{ badge }}
        </span>
      </div>
      <USkeleton
        v-else
        class="rounded-lg relative overflow-hidden aspect-[11/14] w-full"
      />
      <div class="flex mt-4 justify-between items-center text-sm">
        <h3 v-if="product">
          {{ product?.title }}
        </h3>
        <USkeleton v-else class="h-4 w-[160px]" />
        <div class="text-color-dimmed">
          <ProductPrice
            v-if="product"
            :original-price="originalPrice"
            :current-price="currentPrice"
            :currency-code="currencyCode"
            display-inline
          />
          <USkeleton v-else class="h-4 w-[60px]" />
        </div>
      </div>
      <p v-if="product?.material" class="mt-1 text-xs text-color-dimmed">
        {{ product.material }}
      </p>
      <div v-if="colorOption" class="flex gap-1.5 mt-1.5 items-center">
        <span
          v-for="value in colorOption.values"
          :key="value.id"
          class="size-[11px] rounded-full border border-color-line"
          :style="{ backgroundColor: getSwatchColor(value.value) }"
        />
        <span class="text-[10px] text-color-dimmed">
          {{ colorOption.values?.[0]?.value }}
        </span>
      </div>
    </AppLink>
    <button
      v-if="product && withSaveIcon"
      type="button"
      class="absolute right-1.5 top-1.5 flex size-[33px] cursor-pointer items-center justify-center outline-offset-2 focus-visible:outline-2 focus-visible:outline-(--color-ink)"
      :class="isSaved ? 'text-color-accent' : 'text-color-ink'"
      :aria-pressed="isSaved"
      :aria-label="
        $t(
          isSaved
            ? 'product.wishlist.removeTitled'
            : 'product.wishlist.addTitled',
          { title: product.title },
        )
      "
      @click="wishlist.toggle(product.id)"
    >
      <WishlistHeartIcon :filled="isSaved" class="size-[21px]" />
    </button>
  </div>
</template>
