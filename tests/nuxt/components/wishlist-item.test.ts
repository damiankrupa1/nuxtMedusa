import type { StoreProduct } from '@medusajs/types'
import { defineComponent, h } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { useState } from 'nuxt/app'

import WishlistItem from '~/components/wishlist/item.vue'
import { useCartService } from '~/services/cart.service'
import type { BaseRegionCountryWithRegionId } from '~/types/country'

vi.mock('~/services/cart.service', () => ({
  useCartService: vi.fn(),
}))

const updateOrCreateLineItem = vi.fn()

const DAY = 24 * 60 * 60 * 1000

const variant = (
  id: string,
  color: string,
  size: string,
  inventory = 5,
  amount = 39900,
) => ({
  id,
  options: [
    { option_id: 'opt_color', value: color },
    { option_id: 'opt_size', value: size },
  ],
  manage_inventory: true,
  allow_backorder: false,
  inventory_quantity: inventory,
  calculated_price: {
    calculated_amount: amount,
    original_amount: amount,
    currency_code: 'pln',
  },
})

const makeProduct = (overrides: Partial<StoreProduct> = {}) =>
  ({
    id: 'prod_1',
    title: 'Merino crew-neck sweater',
    handle: 'merino-crew-neck',
    material: '100% merino wool',
    thumbnail: null,
    created_at: new Date(Date.now() - 400 * DAY).toISOString(),
    options: [
      {
        id: 'opt_color',
        title: 'Color',
        values: [
          { id: 'v_ecru', value: 'Ecru' },
          { id: 'v_black', value: 'Black' },
        ],
      },
      {
        id: 'opt_size',
        title: 'Size',
        values: [
          { id: 'v_l', value: 'L' },
          { id: 'v_s', value: 'S' },
          { id: 'v_m', value: 'M' },
        ],
      },
    ],
    variants: [
      variant('var_ecru_s', 'Ecru', 'S'),
      variant('var_ecru_m', 'Ecru', 'M'),
      variant('var_ecru_l', 'Ecru', 'L', 0),
      variant('var_black_m', 'Black', 'M'),
    ],
    ...overrides,
  }) as unknown as StoreProduct

const mountItem = (product: StoreProduct) =>
  mountSuspended(
    defineComponent({
      setup() {
        useState<BaseRegionCountryWithRegionId | null>('country').value = {
          iso_2: 'pl',
          region_id: 'reg_pl',
        } as BaseRegionCountryWithRegionId

        return () => h(WishlistItem, { product })
      },
    }),
    { global: { stubs: { NuxtImg: true } } },
  )

describe('wishlist item in Nuxt', () => {
  beforeEach(() => {
    localStorage.clear()
    useState('wishlist').value = []
    useState('wishlist-loaded').value = true
    updateOrCreateLineItem.mockReset().mockResolvedValue({ id: 'cart_1' })
    vi.mocked(useCartService).mockReturnValue({
      updateOrCreateLineItem,
    } as unknown as ReturnType<typeof useCartService>)
  })

  it('links the title to the product page of the current country', async () => {
    const wrapper = await mountItem(makeProduct())
    const links = wrapper.findAll('a').map((a) => a.attributes('href'))

    expect(links).toContain('/pl/products/merino-crew-neck')
    expect(wrapper.text()).toContain('Merino crew-neck sweater')
    expect(wrapper.text()).toContain('100% merino wool')
  })

  it('marks only a recently created product as new', async () => {
    const fresh = await mountItem(
      makeProduct({ created_at: new Date(Date.now() - 2 * DAY).toISOString() }),
    )
    const old = await mountItem(makeProduct())

    expect(fresh.find('span.bg-color-paper').exists()).toBe(true)
    expect(old.find('span.bg-color-paper').exists()).toBe(false)
  })

  it('lists the sizes from small to large and disables one that is sold out', async () => {
    const wrapper = await mountItem(makeProduct())
    const options = wrapper.findAll('select option')

    // the first option is the "choose" prompt
    expect(options.map((o) => o.attributes('value'))).toEqual([
      '',
      'S',
      'M',
      'L',
    ])
    // Ecru is preselected, and Ecru L has no stock
    expect(
      options.find((o) => o.attributes('value') === 'L')?.element,
    ).toHaveProperty('disabled', true)
    expect(
      options.find((o) => o.attributes('value') === 'M')?.element,
    ).toHaveProperty('disabled', false)
  })

  it('shows the color swatches, with the preselected one pressed', async () => {
    const wrapper = await mountItem(makeProduct())
    const swatches = wrapper.findAll('button[aria-pressed]')

    expect(swatches.map((s) => s.attributes('aria-label'))).toEqual([
      'Ecru',
      'Black',
    ])
    expect(swatches.map((s) => s.attributes('aria-pressed'))).toEqual([
      'true',
      'false',
    ])
  })

  it('asks for a size instead of adding the product without one', async () => {
    const wrapper = await mountItem(makeProduct())
    const addButton = wrapper
      .findAll('button')
      .find((b) => b.classes().includes('bg-color-ink'))!

    await addButton.trigger('click')

    expect(updateOrCreateLineItem).not.toHaveBeenCalled()
    expect(wrapper.get('p[role="status"]').text()).not.toBe('')
  })

  it('adds the chosen variant to the cart', async () => {
    const wrapper = await mountItem(makeProduct())

    await wrapper.get('select').setValue('M')
    await wrapper
      .findAll('button')
      .find((b) => b.classes().includes('bg-color-ink'))!
      .trigger('click')

    expect(updateOrCreateLineItem).toHaveBeenCalledWith({
      variant_id: 'var_ecru_m',
      quantity: 1,
    })
  })

  it('takes a product with a single variant straight to the cart', async () => {
    const wrapper = await mountItem(
      makeProduct({
        options: [],
        variants: [
          {
            id: 'var_only',
            options: [],
            manage_inventory: false,
            allow_backorder: false,
            calculated_price: { calculated_amount: 100, currency_code: 'pln' },
          },
        ] as unknown as StoreProduct['variants'],
      }),
    )

    expect(wrapper.find('select').exists()).toBe(false)

    await wrapper
      .findAll('button')
      .find((b) => b.classes().includes('bg-color-ink'))!
      .trigger('click')

    expect(updateOrCreateLineItem).toHaveBeenCalledWith({
      variant_id: 'var_only',
      quantity: 1,
    })
  })

  it('removes the product from the list from the heart and from the link', async () => {
    const heart = await mountItem(makeProduct())
    useState<{ productId: string; addedAt: number }[]>('wishlist').value = [
      { productId: 'prod_1', addedAt: 1 },
    ]

    // a saved product shows a filled heart
    expect(heart.get('button.text-color-accent svg').attributes('fill')).toBe(
      'currentColor',
    )

    await heart.get('button.text-color-accent').trigger('click')
    expect(useState<unknown[]>('wishlist').value).toEqual([])

    useState<{ productId: string; addedAt: number }[]>('wishlist').value = [
      { productId: 'prod_1', addedAt: 1 },
    ]
    const link = await mountItem(makeProduct())
    const removeLink = link
      .findAll('button')
      .find((b) => b.classes().includes('underline'))!

    await removeLink.trigger('click')
    expect(useState<unknown[]>('wishlist').value).toEqual([])
  })
})
