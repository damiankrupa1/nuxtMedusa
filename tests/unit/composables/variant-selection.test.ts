import type { StoreProduct } from '@medusajs/types'
import { describe, expect, it } from 'vitest'

import { useVariantSelection } from '~/composables/product'
import { isColorOption } from '~/utils/color'
import { isVariantInStock, optionsAsKeyMap } from '~/utils/product'

Object.assign(globalThis, { isColorOption, isVariantInStock, optionsAsKeyMap })

const option = (id: string, title: string, values: string[]) => ({
  id,
  title,
  values: values.map((value) => ({ id: `${id}-${value}`, value })),
})

const variant = (
  id: string,
  color: string,
  size: string,
  inventory_quantity: number,
) => ({
  id,
  manage_inventory: true,
  allow_backorder: false,
  inventory_quantity,
  options: [
    { option_id: 'color', value: color },
    { option_id: 'size', value: size },
  ],
})

const product = {
  options: [
    option('color', 'Color', ['Ecru', 'Olive']),
    option('size', 'Size', ['S', 'M']),
  ],
  variants: [
    variant('v-ecru-s', 'Ecru', 'S', 4),
    variant('v-ecru-m', 'Ecru', 'M', 0),
    variant('v-olive-s', 'Olive', 'S', 1),
    variant('v-olive-m', 'Olive', 'M', 2),
  ],
} as unknown as StoreProduct

describe('useVariantSelection', () => {
  it('preselects the first color and waits for the rest', () => {
    const selection = useVariantSelection(() => product)

    expect(selection.selectedOptions.value).toEqual({ color: 'Ecru' })
    expect(selection.selectedVariant.value).toBeNull()
    expect(selection.availability.value).toBe('unselected')
  })

  it('resolves the variant once every option is chosen', () => {
    const selection = useVariantSelection(() => product)

    selection.setOptionValue({ optionId: 'size', value: 'S' })

    expect(selection.selectedVariant.value?.id).toBe('v-ecru-s')
    expect(selection.availability.value).toBe('inStock')
  })

  it('reports a sold-out variant', () => {
    const selection = useVariantSelection(() => product)

    selection.setOptionValue({ optionId: 'size', value: 'M' })

    expect(selection.selectedVariant.value?.id).toBe('v-ecru-m')
    expect(selection.availability.value).toBe('outOfStock')
  })

  it('follows a color change while keeping the size', () => {
    const selection = useVariantSelection(() => product)
    selection.setOptionValue({ optionId: 'size', value: 'M' })

    selection.setOptionValue({ optionId: 'color', value: 'Olive' })

    expect(selection.selectedVariant.value?.id).toBe('v-olive-m')
    expect(selection.availability.value).toBe('inStock')
  })

  it('starts fully selected for a single-variant product', () => {
    const single = {
      options: [option('size', 'Size', ['M'])],
      variants: [
        {
          id: 'only',
          manage_inventory: false,
          options: [{ option_id: 'size', value: 'M' }],
        },
      ],
    } as unknown as StoreProduct

    const selection = useVariantSelection(() => single)

    expect(selection.selectedVariant.value?.id).toBe('only')
    expect(selection.availability.value).toBe('inStock')
  })

  it('starts empty when there is no color option and several variants', () => {
    const sizes = {
      options: [option('size', 'Size', ['S', 'M'])],
      variants: [variant('a', 'x', 'S', 1), variant('b', 'x', 'M', 1)],
    } as unknown as StoreProduct

    expect(useVariantSelection(() => sizes).selectedOptions.value).toBeNull()
  })
})
