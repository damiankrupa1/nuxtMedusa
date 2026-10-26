import type {
  StoreProduct,
  StoreProductOptionValue,
  StoreProductVariant,
} from '@medusajs/types'
import { SORT_OPTIONS, type SortOptionsType } from '~/types/filter'
import type { SchemaAvailability } from '~/types/seo'

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
