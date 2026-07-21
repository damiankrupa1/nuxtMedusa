import type { StoreProduct, StoreProductOptionValue } from '@medusajs/types'
import { describe, expect, it } from '@jest/globals'

import { SORT_OPTIONS } from '../../../app/types/filter'
import {
  getCheapestVariant,
  optionsAsKeyMap,
  sortProducts,
} from '../../../app/utils/product'

describe('product utils', () => {
  const makeProduct = (
    id: string,
    createdAt: string,
    prices: number[],
  ): StoreProduct =>
    ({
      id,
      created_at: createdAt,
      variants: prices.map((price, index) => ({
        id: `${id}-variant-${index}`,
        calculated_price: {
          calculated_amount: price,
        },
      })),
    }) as StoreProduct

  it('returns the cheapest variant', () => {
    const product = makeProduct(
      'product-1',
      '2024-01-01T00:00:00.000Z',
      [100, 50, 75],
    )

    expect(
      getCheapestVariant(product)?.calculated_price?.calculated_amount,
    ).toBe(50)
  })

  it('sorts products by price ascending', () => {
    const products = [
      makeProduct('product-1', '2024-01-01T00:00:00.000Z', [100, 80]),
      makeProduct('product-2', '2024-01-02T00:00:00.000Z', [50, 40]),
    ]

    const sorted = sortProducts(products, SORT_OPTIONS.PRICE_ASC)

    expect(sorted.map((p) => p.id)).toEqual(['product-2', 'product-1'])
  })

  it('sorts products by newest first when no price sort is provided', () => {
    const products = [
      makeProduct('product-1', '2024-01-01T00:00:00.000Z', [100]),
      makeProduct('product-2', '2024-01-03T00:00:00.000Z', [50]),
      makeProduct('product-3', '2024-01-02T00:00:00.000Z', [75]),
    ]

    const sorted = sortProducts(products)

    expect(sorted.map((p) => p.id)).toEqual([
      'product-2',
      'product-3',
      'product-1',
    ])
  })

  it('builds an option id to value map', () => {
    const options = [
      { option_id: 'size', value: 'M' },
      { option_id: 'color', value: 'blue' },
    ] as StoreProductOptionValue[]

    expect(optionsAsKeyMap(options)).toEqual({
      size: 'M',
      color: 'blue',
    })
  })
})
