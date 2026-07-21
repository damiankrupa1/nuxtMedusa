import { describe, expect, it } from '@jest/globals'
import { mount } from '@vue/test-utils'
import type { StoreCartLineItem } from '@medusajs/types'

import CartItemPrice from '../../../app/components/cart/item/price.vue'
import ProductPrice from '../../../app/components/product/price.vue'

describe('cart item price component', () => {
  const stubs = {
    StoreLocalizedPrice: {
      template: '<span>{{ amount }}</span>',
      props: ['amount', 'currencyCode'],
    },
  }
  const components = { ProductPrice }

  const makeItem = (overrides: Partial<StoreCartLineItem>) =>
    ({
      total: 80,
      original_total: 100,
      adjustments: [],
      ...overrides,
    }) as StoreCartLineItem

  it('subtracts adjustments from the total to get the current price', () => {
    const wrapper = mount(CartItemPrice, {
      props: {
        item: makeItem({
          total: 100,
          adjustments: [{ amount: 10 }, { amount: 5 }] as StoreCartLineItem['adjustments'],
        }),
        currencyCode: 'usd',
      },
      global: { stubs, components },
    })

    expect(wrapper.text()).toContain('85')
  })

  it('falls back to a zero current price when there is no total', () => {
    const wrapper = mount(CartItemPrice, {
      props: { item: makeItem({ total: undefined }), currencyCode: 'usd' },
      global: { stubs, components },
    })

    expect(wrapper.text()).toContain('0')
  })
})
