import type { StoreProduct } from '@medusajs/types'
import { describe, expect, it } from 'vitest'

import { isColorOption } from '~/utils/color'
import {
  isNewProduct,
  isOptionValueAvailable,
  isSizeOption,
  NEW_PRODUCT_DAYS,
  sortOptionValues,
} from '~/utils/product'

const DAY = 24 * 60 * 60 * 1000

describe('isSizeOption', () => {
  it('matches English and Polish titles', () => {
    expect(isSizeOption({ title: 'Size' })).toBe(true)
    expect(isSizeOption({ title: 'Rozmiar' })).toBe(true)
    expect(isSizeOption({ title: 'Color' })).toBe(false)
  })
})

describe('isNewProduct', () => {
  const now = Date.parse('2026-11-14T12:00:00Z')

  it('is new inside the window and not after it', () => {
    const at = (days: number) => ({
      created_at: new Date(now - days * DAY).toISOString(),
    })

    expect(isNewProduct(at(0), now)).toBe(true)
    expect(isNewProduct(at(NEW_PRODUCT_DAYS), now)).toBe(true)
    expect(isNewProduct(at(NEW_PRODUCT_DAYS + 1), now)).toBe(false)
  })

  it('is not new without a creation date or when it lies in the future', () => {
    expect(isNewProduct({}, now)).toBe(false)
    expect(
      isNewProduct({ created_at: new Date(now + DAY).toISOString() }, now),
    ).toBe(false)
  })
})

describe('sortOptionValues', () => {
  it('orders clothing sizes from small to large', () => {
    expect(sortOptionValues(['L', 'XS', 'M', 'XL', 'S'])).toEqual([
      'XS',
      'S',
      'M',
      'L',
      'XL',
    ])
  })

  it('keeps Medusa order for anything that is not a letter size', () => {
    expect(sortOptionValues(['Olive', 'Ecru'])).toEqual(['Olive', 'Ecru'])
    expect(sortOptionValues(['42', '40', '41'])).toEqual(['42', '40', '41'])
    expect(sortOptionValues(['M', 'One size'])).toEqual(['M', 'One size'])
  })

  it('does not mutate its input', () => {
    const values = ['M', 'S']
    sortOptionValues(values)
    expect(values).toEqual(['M', 'S'])
  })
})

describe('isColorOption', () => {
  it('matches English and Polish titles', () => {
    expect(isColorOption({ title: 'Color' })).toBe(true)
    expect(isColorOption({ title: 'Colour' })).toBe(true)
    expect(isColorOption({ title: 'Kolor' })).toBe(true)
    expect(isColorOption({ title: 'Size' })).toBe(false)
  })
})

describe('isOptionValueAvailable', () => {
  const variant = (color: string, size: string, quantity: number) => ({
    options: [
      { option_id: 'color', value: color },
      { option_id: 'size', value: size },
    ],
    manage_inventory: true,
    allow_backorder: false,
    inventory_quantity: quantity,
  })
  const product = {
    variants: [
      variant('Ecru', 'S', 3),
      variant('Ecru', 'M', 0),
      variant('Olive', 'M', 2),
    ],
  } as unknown as StoreProduct

  it('looks only at variants matching the other selected options', () => {
    const ecru = { color: 'Ecru' }

    expect(isOptionValueAvailable(product, ecru, 'size', 'S')).toBe(true)
    expect(isOptionValueAvailable(product, ecru, 'size', 'M')).toBe(false)
    expect(
      isOptionValueAvailable(product, { color: 'Olive' }, 'size', 'M'),
    ).toBe(true)
  })

  it('ignores the current value of the option itself', () => {
    expect(
      isOptionValueAvailable(
        product,
        { color: 'Ecru', size: 'S' },
        'size',
        'M',
      ),
    ).toBe(false)
    expect(
      isOptionValueAvailable(
        product,
        { color: 'Olive', size: 'M' },
        'color',
        'Ecru',
      ),
    ).toBe(false)
  })

  it('checks stock across all variants when nothing is selected', () => {
    expect(isOptionValueAvailable(product, null, 'size', 'M')).toBe(true)
    expect(isOptionValueAvailable(product, null, 'size', 'XL')).toBe(false)
  })
})
