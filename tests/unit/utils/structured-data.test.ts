import type { StoreProduct } from '@medusajs/types'
import { describe, expect, it } from 'vitest'

import { buildProductJsonLd, serializeJsonLd } from '~/utils/structured-data'

const URL = 'https://shop.example.com/pl/products/shorts'

const makeProduct = (overrides: Partial<StoreProduct> = {}): StoreProduct =>
  ({
    id: 'prod_1',
    title: 'Linen shorts',
    description: 'Relaxed fit',
    thumbnail: 'https://cdn.example.com/shorts.jpg',
    images: [
      { id: 'img_1', url: 'https://cdn.example.com/shorts.jpg' },
      { id: 'img_2', url: 'https://cdn.example.com/shorts-back.jpg' },
    ],
    variants: [
      {
        id: 'variant_s',
        title: 'S',
        sku: 'SHORTS-S',
        manage_inventory: true,
        allow_backorder: false,
        inventory_quantity: 4,
        calculated_price: { calculated_amount: 129.99, currency_code: 'pln' },
      },
      {
        id: 'variant_m',
        title: 'M',
        sku: null,
        manage_inventory: true,
        allow_backorder: false,
        inventory_quantity: 0,
        calculated_price: { calculated_amount: 139, currency_code: 'pln' },
      },
    ],
    ...overrides,
  }) as unknown as StoreProduct

describe('buildProductJsonLd', () => {
  it('maps a product to schema.org Product with one offer per variant', () => {
    expect(buildProductJsonLd(makeProduct(), URL)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Linen shorts',
      url: URL,
      description: 'Relaxed fit',
      image: [
        'https://cdn.example.com/shorts.jpg',
        'https://cdn.example.com/shorts-back.jpg',
      ],
      offers: [
        {
          '@type': 'Offer',
          url: URL,
          price: 129.99,
          priceCurrency: 'PLN',
          availability: 'https://schema.org/InStock',
          sku: 'SHORTS-S',
          name: 'S',
        },
        {
          '@type': 'Offer',
          url: URL,
          price: 139,
          priceCurrency: 'PLN',
          availability: 'https://schema.org/OutOfStock',
          name: 'M',
        },
      ],
    })
  })

  it('leaves out variants without a price in the region', () => {
    const product = makeProduct()
    product.variants![1]!.calculated_price = undefined

    expect(buildProductJsonLd(product, URL)?.offers).toHaveLength(1)
  })

  it('keeps a free variant', () => {
    const product = makeProduct()
    product.variants![0]!.calculated_price = {
      calculated_amount: 0,
      currency_code: 'pln',
    } as never

    expect(buildProductJsonLd(product, URL)?.offers[0]?.price).toBe(0)
  })

  it('returns null when no variant has a price', () => {
    const product = makeProduct()
    product.variants!.forEach((variant) => {
      variant.calculated_price = undefined
    })

    expect(buildProductJsonLd(product, URL)).toBeNull()
  })

  it('leaves out a missing description and images', () => {
    const jsonLd = buildProductJsonLd(
      makeProduct({ description: null, thumbnail: null, images: null }),
      URL,
    )

    expect(jsonLd).not.toHaveProperty('description')
    expect(jsonLd).not.toHaveProperty('image')
  })
})

describe('serializeJsonLd', () => {
  it('keeps a closing script tag in the data from ending the script', () => {
    const json = serializeJsonLd({ description: '</script><script>x()' })

    expect(json).not.toContain('</script>')
    expect(JSON.parse(json)).toEqual({ description: '</script><script>x()' })
  })
})
