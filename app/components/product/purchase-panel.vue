<script setup lang="ts">
import type { StoreProduct } from '@medusajs/types'

const { product } = defineProps<{
  product: StoreProduct
}>()

const { t } = useI18n()

const { selectedOptions, selectedVariant, availability, setOptionValue } =
  useVariantSelection(() => product)

// The design asks for the color before the size; Medusa lists options in the
// order they were created. The sort is stable, so the rest keeps its order.
const orderedOptions = computed(() =>
  [...(product.options ?? [])].sort(
    (a, b) => Number(isColorOption(b)) - Number(isColorOption(a)),
  ),
)

const hasMoreThanOneVariant = computed(
  () => (product.variants?.length ?? 0) > 1,
)

const hasSizeOption = computed(
  () => hasMoreThanOneVariant.value && orderedOptions.value.some(isSizeOption),
)

const variantForPrice = computed(
  () => selectedVariant.value || getCheapestVariant(product),
)
const currentPrice = computed(
  () => variantForPrice.value?.calculated_price?.calculated_amount ?? null,
)
const originalPrice = computed(
  () => variantForPrice.value?.calculated_price?.original_amount ?? null,
)
const currencyCode = computed(
  () => variantForPrice.value?.calculated_price?.currency_code ?? null,
)

function unavailableValues(option: NonNullable<StoreProduct['options']>[0]) {
  return (option.values ?? [])
    .map((v) => v.value)
    .filter(
      (value) =>
        !isOptionValueAvailable(
          product,
          selectedOptions.value,
          option.id,
          value,
        ),
    )
}

const buttonLabel = computed(() => {
  if (availability.value === 'unselected') {
    return t('product.variantSelector.selectVariant')
  }
  return availability.value === 'outOfStock'
    ? t('product.variantSelector.outOfStock')
    : t('product.variantSelector.addToCart')
})

const { isCartDropdownOpen } = useCartDropdown()
const { loading, mutate } = useAddToCart()

async function handleAddToCart() {
  if (!selectedVariant.value) return
  await mutate({ variant_id: selectedVariant.value.id, quantity: 1 })
  isCartDropdownOpen.value = true
}

// TODO(#58): mock. No wishlist exists (damiankrupa1/medusaDemo#26): the heart
// only flips a local visual state and saves nothing.
const isSaved = ref(false)
</script>

<template>
  <div class="flex flex-col">
    <!--
      TODO(#58): mock. Medusa has no brand field (damiankrupa1/medusaDemo#25),
      so every product shows the same brand. TODO(#59): the design has no link
      to the collection here; the old one was dropped, confirm or restore it.
    -->
    <p
      class="text-[11px] font-medium uppercase leading-[1.5] tracking-[1.3px] text-color-accent"
    >
      {{ $t('product.brand') }}
    </p>
    <!-- TODO(#59): the design's title is 44px, this size renders 48px. -->
    <AppHeading as="h1" variant="display" class="mt-3">
      {{ product.title }}
    </AppHeading>
    <p
      v-if="product.material"
      class="mt-[18px] text-[13px] leading-[1.5] text-color-muted"
    >
      {{ product.material }}
    </p>

    <div class="mt-4 text-[22px] font-medium leading-[1.5] text-color-ink">
      <ProductPrice
        :original-price="originalPrice"
        :current-price="currentPrice"
        :currency-code="currencyCode"
        :is-cheapest="!selectedVariant"
        display-inline
      />
    </div>
    <!--
      TODO(#59): shown for every region, wrong where prices are net. Moves to
      the ProductPageInfo Global (damiankrupa1/simple-landing-page-nuxt#28).
    -->
    <p class="mt-0.5 text-[10px] leading-[1.5] text-color-muted">
      {{ $t('product.priceIncludesVat') }}
    </p>

    <p
      v-if="product.description"
      class="mt-6 max-w-[460px] text-sm leading-[1.65] text-color-muted"
    >
      {{ product.description }}
    </p>

    <div v-if="hasMoreThanOneVariant" class="mt-12 flex flex-col gap-6">
      <ProductOptionSelector
        v-for="option in orderedOptions"
        :key="option.id"
        :option="option"
        :current="selectedOptions?.[option.id]"
        :unavailable="unavailableValues(option)"
        @select:option="setOptionValue"
      >
        <template v-if="isSizeOption(option)" #action>
          <ProductSizeGuide />
        </template>
      </ProductOptionSelector>
    </div>
    <!--
      TODO(#58): mock. The same sentence for every product; it should be a
      per-product fit note from the backend (damiankrupa1/medusaDemo#25).
    -->
    <p
      v-if="hasSizeOption"
      class="mt-3.5 text-[11px] leading-[1.5] text-color-muted"
    >
      {{ $t('product.fitHint') }}
    </p>

    <div class="mt-6 flex gap-3">
      <!-- TODO(#59): the design's button is 54px high with 13px text. -->
      <AppButtonPrimary
        class="flex-1"
        block
        :loading="loading"
        :disabled="availability !== 'inStock'"
        @click="handleAddToCart"
      >
        {{ buttonLabel }}
      </AppButtonPrimary>
      <button
        type="button"
        class="flex size-12 shrink-0 cursor-pointer items-center justify-center border border-color-line text-color-ink outline-offset-2 hover:border-color-ink focus-visible:outline-2 focus-visible:outline-(--color-ink)"
        :aria-pressed="isSaved"
        :aria-label="
          isSaved ? $t('product.wishlist.remove') : $t('product.wishlist.add')
        "
        @click="isSaved = !isSaved"
      >
        <UIcon
          name="i-lucide-heart"
          class="size-5"
          :class="{ 'fill-current': isSaved }"
        />
      </button>
    </div>

    <!--
      Always mounted, so a change of the selected variant is announced.
      TODO(#59): the 1–2 working days is a static promise for every product;
      it moves to the ProductPageInfo Global
      (damiankrupa1/simple-landing-page-nuxt#28) or a backend lead time.
    -->
    <p
      role="status"
      class="mt-5 text-[11px] leading-[1.5]"
      :class="
        availability === 'inStock' ? 'text-color-accent' : 'text-color-muted'
      "
    >
      <template v-if="availability === 'inStock'">
        {{ $t('product.availability.inStock') }}
      </template>
      <template v-else-if="availability === 'outOfStock'">
        {{ $t('product.availability.outOfStock') }}
      </template>
    </p>

    <ProductDeliveryInfo class="mt-4" />
  </div>
</template>
