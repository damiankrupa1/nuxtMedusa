import type {
  StoreProduct,
  StoreProductOptionValue,
  StoreProductVariant,
} from '@medusajs/types'
import { SORT_OPTIONS, type SortOptionsType } from '~/types/filter'
import type { SchemaAvailability } from '~/types/seo'

/**
 * A product with this handle in the payload entries of other list fetches
 * (`products:*`), so opening a product from a list needs no request. An entry
 * can be anything the payload holds: `null` (a fetch that failed or found
 * nothing), a string, an object without `products`. Those are skipped; reading
 * `.products` of a `null` entry threw, which made the product page answer 500
 * whenever Medusa was down.
 */
export function findProductInPayload(
  payload: Record<string, unknown>,
  handle: string,
): StoreProduct | null {
  const lists = Object.values(payload).flatMap((entry): unknown[] => {
    if (typeof entry !== 'object' || entry === null) return []

    const productsList = (entry as { products?: unknown }).products
    return Array.isArray(productsList) ? productsList : []
  })

  const product = lists.find(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      (item as Record<string, unknown>).handle === handle,
  ) as StoreProduct | undefined

  return product ?? null
}

export function getCheapestVariant(product?: StoreProduct) {
  if (!product || !product.id) {
    throw new Error('No product provided')
  }

  const variant = product.variants
    ?.filter((v) => !!v.calculated_price)
    .sort((a, b) => {
      if (
        a.calculated_price?.calculated_amount != null &&
        b.calculated_price?.calculated_amount != null
      ) {
        return (
          a.calculated_price?.calculated_amount -
          b.calculated_price?.calculated_amount
        )
      }
      return 0
    })[0]

  return variant ?? null
}

export function getCheapestVariantPriceAmount(product: StoreProduct) {
  return (
    getCheapestVariant(product)?.calculated_price?.calculated_amount ?? null
  )
}

export function sortProducts(
  products: StoreProduct[],
  sortBy?: SortOptionsType,
) {
  if (sortBy === SORT_OPTIONS.PRICE_ASC || sortBy === SORT_OPTIONS.PRICE_DESC) {
    return products.sort((a, b) => {
      const priceA = getCheapestVariantPriceAmount(a) ?? 0
      const priceB = getCheapestVariantPriceAmount(b) ?? 0
      const diff = priceA - priceB

      return sortBy === SORT_OPTIONS.PRICE_ASC ? diff : -diff
    })
  } else {
    return products.sort((a, b) => {
      return (
        new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
      )
    })
  }
}

export function optionsAsKeyMap(
  variantOptions: StoreProductOptionValue[] | null,
): Record<string, string> | null {
  return (
    variantOptions?.reduce(
      (acc: Record<string, string>, varOpt: StoreProductOptionValue) => {
        if (!varOpt.option_id) return acc
        acc[varOpt.option_id] = varOpt.value
        return acc
      },
      {},
    ) ?? null
  )
}

// Whether a variant can be bought, in schema.org terms. A variant without
// managed inventory is always available; one that is out of stock but allows
// backorders can still be ordered.
export function getVariantAvailability(
  variant: Pick<
    StoreProductVariant,
    'manage_inventory' | 'allow_backorder' | 'inventory_quantity'
  >,
): SchemaAvailability {
  if (!variant.manage_inventory) return 'InStock'
  if ((variant.inventory_quantity ?? 0) > 0) return 'InStock'
  if (variant.allow_backorder) return 'BackOrder'
  return 'OutOfStock'
}

export function isVariantInStock(
  variant: Parameters<typeof getVariantAvailability>[0],
) {
  return getVariantAvailability(variant) !== 'OutOfStock'
}

// A product counts as new for this long after it was created. Medusa has no
// "new" flag or tag (see missing-medusa-api-data), so the badge is derived
// from `created_at`.
// TODO(#58): replace with a real flag from the backend
// (damiankrupa1/medusaDemo#25). TODO(#59): confirm the 30 days.
export const NEW_PRODUCT_DAYS = 30

export const isSizeOption = (option: { title: string }) =>
  /size|rozmiar/i.test(option.title)

export function isNewProduct(
  product: Pick<StoreProduct, 'created_at'>,
  now = Date.now(),
) {
  if (!product.created_at) return false
  const age = now - new Date(product.created_at).getTime()
  return age >= 0 && age <= NEW_PRODUCT_DAYS * 24 * 60 * 60 * 1000
}

const SIZE_ORDER = ['xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl', '3xl', '4xl']

// Clothing sizes read XS → XL, not alphabetically. Values that are not all
// letter sizes (numbers, colors, "One size") keep the order Medusa returns.
export function sortOptionValues(values: string[]) {
  const ranks = values.map((value) => SIZE_ORDER.indexOf(value.toLowerCase()))
  if (ranks.some((rank) => rank === -1)) return [...values]
  return values
    .map((value, index) => ({ value, rank: ranks[index]! }))
    .sort((a, b) => a.rank - b.rank)
    .map(({ value }) => value)
}

// Whether the value can still be bought together with what is already
// selected in the other options: some in-stock variant has it.
export function isOptionValueAvailable(
  product: Pick<StoreProduct, 'variants'>,
  selected: Record<string, string> | null,
  optionId: string,
  value: string,
) {
  return (
    product.variants?.some((variant) => {
      const options = optionsAsKeyMap(variant.options) ?? {}
      if (options[optionId] !== value) return false
      const matchesOthers = Object.entries(selected ?? {}).every(
        ([id, selectedValue]) =>
          id === optionId || options[id] === selectedValue,
      )
      return matchesOthers && isVariantInStock(variant)
    }) ?? false
  )
}
