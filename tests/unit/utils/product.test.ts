import type { StoreProduct, StoreProductOptionValue } from '@medusajs/types'
import { describe, expect, it } from 'vitest'

import { SORT_OPTIONS } from '~/types/filter'
import {
  findProductInPayload,
  getCheapestVariant,
  getVariantAvailability,
  isVariantInStock,
  optionsAsKeyMap,
  sortProducts,
} from '~/utils/product'

describe('findProductInPayload', () => {
  const coat = { id: 'prod_1', handle: 'wool-coat' }
  const scarf = { id: 'prod_2', handle: 'scarf' }

  it('finds the product in the products list of any entry', () => {
    expect(
      findProductInPayload(
        {
          'cms:footer:pl': { links: [] },
          'products:::::24:0:reg_pl:pl': { products: [coat, scarf], count: 2 },
        },
        'scarf',
      ),
    ).toBe(scarf)
  })

  it('is null when no entry has that handle', () => {
    expect(
      findProductInPayload({ list: { products: [coat] } }, 'unknown'),
    ).toBeNull()
    expect(findProductInPayload({}, 'wool-coat')).toBeNull()
  })

  it('skips entries that are not objects, as a failed fetch leaves them', () => {
    // A fetch that failed or found nothing leaves `null` (or another
    // primitive) in the payload; reading `.products` of it threw, and the
    // product page answered 500 while Medusa was down
    expect(
      findProductInPayload(
        {
          failed: null,
          missing: undefined,
          text: 'x',
          count: 3,
          list: { products: [coat] },
        },
        'wool-coat',
      ),
    ).toBe(coat)
    expect(findProductInPayload({ failed: null }, 'wool-coat')).toBeNull()
  })

  it('skips entries whose products is not an array, or holds non-objects', () => {
    expect(
      findProductInPayload(
        {
          a: { products: 'none' },
          b: { products: [null, 7, 'x'] },
          c: { other: [coat] },
        },
        'wool-coat',
      ),
    ).toBeNull()
  })
})

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

  it('returns null when no variants have prices', () => {
    const product = makeProduct('product-1', '2024-01-01T00:00:00.000Z', [])

    expect(getCheapestVariant(product)).toBeNull()
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

  describe('variant availability', () => {
    it('is in stock when the inventory is not managed', () => {
      const variant = {
        manage_inventory: false,
        allow_backorder: false,
        inventory_quantity: 0,
      }

      expect(getVariantAvailability(variant)).toBe('InStock')
      expect(isVariantInStock(variant)).toBe(true)
    })

    it('treats an unset manage_inventory as not managed', () => {
      expect(
        getVariantAvailability({
          manage_inventory: null,
          allow_backorder: null,
        }),
      ).toBe('InStock')
    })

    it('is in stock when managed inventory has units left', () => {
      expect(
        getVariantAvailability({
          manage_inventory: true,
          allow_backorder: false,
          inventory_quantity: 3,
        }),
      ).toBe('InStock')
    })

    it('is a backorder when sold out but backorders are allowed', () => {
      const variant = {
        manage_inventory: true,
        allow_backorder: true,
        inventory_quantity: 0,
      }

      expect(getVariantAvailability(variant)).toBe('BackOrder')
      expect(isVariantInStock(variant)).toBe(true)
    })

    it('is out of stock when sold out without backorders', () => {
      const variant = {
        manage_inventory: true,
        allow_backorder: false,
        inventory_quantity: 0,
      }

      expect(getVariantAvailability(variant)).toBe('OutOfStock')
      expect(isVariantInStock(variant)).toBe(false)
    })

    it('is out of stock when the managed quantity was not returned', () => {
      expect(
        getVariantAvailability({
          manage_inventory: true,
          allow_backorder: false,
        }),
      ).toBe('OutOfStock')
    })
  })
})
