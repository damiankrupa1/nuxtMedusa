import { describe, expect, it } from '@jest/globals'
import { mount } from '@vue/test-utils'

import ProductPrice from '../../../app/components/product/price.vue'

describe('product price component', () => {
  const stubs = {
    StoreLocalizedPrice: {
      template: '<span>{{ amount }}</span>',
      props: ['amount', 'currencyCode'],
    },
  }

  it('shows only the current price when there is no discount', () => {
    const wrapper = mount(ProductPrice, {
      props: { currentPrice: 100, currencyCode: 'usd' },
      global: { stubs },
    })

    expect(wrapper.text()).toContain('100')
    expect(wrapper.find('.line-through').exists()).toBe(false)
  })

  it('shows the original price struck through when discounted', () => {
    const wrapper = mount(ProductPrice, {
      props: { originalPrice: 100, currentPrice: 80, currencyCode: 'usd' },
      global: { stubs },
    })

    expect(wrapper.find('.line-through').text()).toContain('100')
    expect(wrapper.text()).toContain('80')
  })

  it('shows the percentage discount when extended', () => {
    const wrapper = mount(ProductPrice, {
      props: { originalPrice: 100, currentPrice: 80, currencyCode: 'usd', extended: true },
      global: { stubs },
    })

    expect(wrapper.text()).toContain('-20%')
    expect(wrapper.text()).toContain('Original:')
  })

  it('shows a "From" label when the price is the cheapest of a range', () => {
    const wrapper = mount(ProductPrice, {
      props: { currentPrice: 100, currencyCode: 'usd', isCheapest: true },
      global: { stubs },
    })

    expect(wrapper.text()).toContain('From')
  })
})
