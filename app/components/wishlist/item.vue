<script setup lang="ts">
import type { StoreProduct } from '@medusajs/types'

const { product } = defineProps<{
  product: StoreProduct
}>()

const { t } = useI18n()
const wishlist = useWishlist()
const baseId = useId()

const productLink = useCountryLink(() =>
  product.handle
    ? {
        name: 'countryCode-products-handle',
        params: { handle: product.handle },
      }
    : undefined,
)

const { selectedOptions, selectedVariant, availability, setOptionValue } =
  useVariantSelection(() => product)

const hasMoreThanOneVariant = computed(
  () => (product.variants?.length ?? 0) > 1,
)

const colorOption = computed(() =>
  hasMoreThanOneVariant.value
    ? product.options?.find(isColorOption)
    : undefined,
)
const selectableOptions = computed(() =>
  hasMoreThanOneVariant.value
    ? (product.options ?? []).filter((option) => !isColorOption(option))
    : [],
)
const selectedColor = computed(() =>
  colorOption.value ? selectedOptions.value?.[colorOption.value.id] : undefined,
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

type ProductOption = NonNullable<StoreProduct['options']>[number]

const selectId = (option: ProductOption) => `${baseId}-${option.id}`

const valuesOf = (option: ProductOption) => {
  const values = (option.values ?? []).map((v) => v.value)
  return isSizeOption(option) ? sortOptionValues(values) : values
}

const isAvailable = (option: ProductOption, value: string) =>
  isOptionValueAvailable(product, selectedOptions.value, option.id, value)

function onSelect(option: ProductOption, event: Event) {
  setOptionValue({
    optionId: option.id,
    value: (event.target as HTMLSelectElement).value,
  })
}

// TODO(#79): confirm. The design keeps the button enabled while the size is
// still "Wybierz rozmiar", so a click without a size asks for it instead of
// being disabled; only an out-of-stock variant disables the button.
const missingOption = ref<ProductOption | null>(null)

watch(selectedVariant, (variant) => {
  if (variant) missingOption.value = null
})

const missingHint = computed(() =>
  missingOption.value
    ? t('pages.wishlist.item.chooseFirst', {
        option: missingOption.value.title,
      })
    : '',
)

const isOutOfStock = computed(() => availability.value === 'outOfStock')

const { isCartDropdownOpen } = useCartDropdown()
const { loading, mutate } = useAddToCart()

async function handleAddToCart() {
  if (!selectedVariant.value) {
    const missing = selectableOptions.value.find(
      (option) => !selectedOptions.value?.[option.id],
    )
    missingOption.value = missing ?? null
    if (missing) document.getElementById(selectId(missing))?.focus()
    return
  }
  await mutate({ variant_id: selectedVariant.value.id, quantity: 1 })
  isCartDropdownOpen.value = true
}
</script>

<template>
  <article class="flex w-full min-w-0 flex-col gap-4">
    <div class="relative aspect-[4/5] w-full overflow-hidden bg-color-sand">
      <NuxtImg
        v-if="product.thumbnail"
        :src="product.thumbnail"
        alt=""
        sizes="50vw lg:25vw"
        class="size-full object-cover object-center"
      />
      <!-- The title below is the accessible link; this one covers the photo. -->
      <NuxtLink
        v-if="productLink"
        :to="productLink"
        prefetch
        class="absolute inset-0"
        tabindex="-1"
        aria-hidden="true"
      />
      <!-- TODO(#79): the design's second badge ("DOBRA BAZA") has no data. -->
      <span
        v-if="isNewProduct(product)"
        class="absolute left-3.5 top-3.5 bg-color-paper px-[9px] py-1.5 text-[9px] uppercase leading-none text-color-ink"
      >
        {{ $t('product.gallery.new') }}
      </span>
      <button
        type="button"
        class="absolute right-3 top-3 flex size-8 cursor-pointer items-center justify-center text-color-accent outline-offset-2 focus-visible:outline-2 focus-visible:outline-(--color-ink)"
        :aria-label="$t('pages.wishlist.item.remove')"
        @click="wishlist.remove(product.id)"
      >
        <WishlistHeartIcon filled class="size-5" />
      </button>
    </div>

    <div class="flex flex-col gap-[7px]">
      <!-- TODO(#79): mock, the same brand for every product (medusaDemo#25). -->
      <p
        class="text-[11px] font-medium uppercase leading-normal text-color-ink"
      >
        {{ $t('product.brand') }}
      </p>
      <h3 class="text-sm leading-normal text-color-ink">
        <NuxtLink
          v-if="productLink"
          :to="productLink"
          prefetch
          class="hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ink)"
        >
          {{ product.title }}
        </NuxtLink>
        <template v-else>{{ product.title }}</template>
      </h3>
      <p
        v-if="product.material"
        class="text-xs leading-normal text-color-muted"
      >
        {{ product.material }}
      </p>
      <div class="text-sm font-medium leading-normal text-color-ink">
        <ProductPrice
          :original-price="originalPrice"
          :current-price="currentPrice"
          :currency-code="currencyCode"
          :is-cheapest="!selectedVariant"
          display-inline
        />
      </div>

      <div
        v-if="colorOption"
        role="group"
        :aria-label="colorOption.title"
        class="flex items-center gap-[9px] pt-[5px]"
      >
        <button
          v-for="value in colorOption.values"
          :key="value.id"
          type="button"
          class="flex size-[19px] cursor-pointer items-center justify-center rounded-full border outline-offset-2 focus-visible:outline-2 focus-visible:outline-(--color-ink) disabled:cursor-not-allowed disabled:opacity-40"
          :class="
            selectedColor === value.value
              ? 'border-color-ink'
              : 'border-transparent'
          "
          :aria-pressed="selectedColor === value.value"
          :aria-label="value.value"
          :disabled="!isAvailable(colorOption, value.value)"
          @click="
            setOptionValue({ optionId: colorOption.id, value: value.value })
          "
        >
          <span
            class="size-[13px] rounded-full border border-color-line"
            :style="{ backgroundColor: getSwatchColor(value.value) }"
          />
        </button>
        <span v-if="selectedColor" class="text-[10px] text-color-muted">
          {{ selectedColor }}
        </span>
      </div>
    </div>

    <!-- Pushed to the bottom, so the buttons line up across cards of different heights. -->
    <div class="mt-auto flex flex-col gap-2.5">
      <label
        v-for="option in selectableOptions"
        :key="option.id"
        class="flex items-center gap-2 border border-color-line px-[18px] py-3.5 text-[11px] leading-normal text-color-ink focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-(--color-ink)"
      >
        <span class="shrink-0">{{ option.title }}:</span>
        <select
          :id="selectId(option)"
          :value="selectedOptions?.[option.id] ?? ''"
          class="min-w-0 flex-1 cursor-pointer appearance-none bg-transparent text-[11px] outline-none"
          @change="onSelect(option, $event)"
        >
          <option value="">
            {{ $t('pages.wishlist.item.choose', { option: option.title }) }}
          </option>
          <option
            v-for="value in valuesOf(option)"
            :key="value"
            :value="value"
            :disabled="!isAvailable(option, value)"
          >
            {{ value }}
          </option>
        </select>
        <UIcon name="i-lucide-chevron-down" class="size-3.5 shrink-0" />
      </label>

      <!--
        The live region is always mounted (and takes no room), so a missing
        choice is announced when it appears; the visible hint is the same text.
      -->
      <p role="status" class="sr-only">
        <template v-if="missingOption">{{ missingHint }}</template>
      </p>
      <p
        v-if="missingOption"
        aria-hidden="true"
        class="text-[11px] leading-normal text-color-muted"
      >
        {{ missingHint }}
      </p>

      <AppButtonPrimary
        block
        :loading="loading"
        :disabled="isOutOfStock"
        @click="handleAddToCart"
      >
        {{
          isOutOfStock
            ? t('product.variantSelector.outOfStock')
            : t('product.variantSelector.addToCart')
        }}
      </AppButtonPrimary>
      <button
        type="button"
        class="cursor-pointer pt-1 text-center text-[10px] leading-normal text-color-muted underline outline-offset-2 hover:text-color-ink focus-visible:outline-2 focus-visible:outline-(--color-ink)"
        @click="wishlist.remove(product.id)"
      >
        {{ $t('pages.wishlist.item.remove') }}
      </button>
    </div>
  </article>
</template>
