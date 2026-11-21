import type { StoreProduct } from '@medusajs/types'
import { defineComponent, h } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtData, useState } from 'nuxt/app'

import WishlistPage from '~/pages/[countryCode]/wishlist.vue'
import { productRepository } from '~/repository/product.repository'
import type { BaseRegionCountryWithRegionId } from '~/types/country'
import { WISHLIST_STORAGE_KEY } from '~/types/wishlist'

vi.mock('~/repository/product.repository', () => ({
  productRepository: vi.fn(),
}))

const listProducts = vi.fn()

const makeProduct = (id: string, title: string) =>
  ({
    id,
    title,
    handle: id,
    material: null,
    thumbnail: null,
    created_at: '2020-01-01T00:00:00.000Z',
    options: [],
    variants: [
      {
        id: `var_${id}`,
        options: [],
        manage_inventory: false,
        allow_backorder: false,
        calculated_price: {
          calculated_amount: 100,
          original_amount: 100,
          currency_code: 'pln',
        },
      },
    ],
  }) as unknown as StoreProduct

const saved = (...ids: string[]) =>
  localStorage.setItem(
    WISHLIST_STORAGE_KEY,
    JSON.stringify(
      ids.map((productId, i) => ({
        productId,
        // the first id is the newest
        addedAt: 1000 - i,
      })),
    ),
  )

const mountPage = async () => {
  const wrapper = await mountSuspended(
    defineComponent({
      setup() {
        useState<BaseRegionCountryWithRegionId | null>('country').value = {
          iso_2: 'pl',
          region_id: 'reg_pl',
        } as BaseRegionCountryWithRegionId

        return () => h(WishlistPage)
      },
    }),
    { global: { stubs: { NuxtImg: true } } },
  )
  // what app/plugins/wishlist.client.ts does once the app is ready
  useWishlist().load()
  await flushPromises()
  return wrapper
}

const cards = (wrapper: Awaited<ReturnType<typeof mountPage>>) =>
  wrapper.findAll('section ul article')
const heading = (wrapper: Awaited<ReturnType<typeof mountPage>>) =>
  wrapper.get('section h2').text()

const UNAVAILABLE = 'This product is no longer available'

describe('wishlist page in Nuxt', () => {
  beforeEach(() => {
    localStorage.clear()
    clearNuxtData()
    useState('wishlist').value = []
    useState('wishlist-loaded').value = false
    listProducts.mockReset()
    vi.mocked(productRepository).mockReturnValue({
      listProducts,
    } as unknown as ReturnType<typeof productRepository>)
  })

  it('shows every saved product, newest first, and no unavailable card', async () => {
    saved('prod_c', 'prod_a', 'prod_b')
    // Medusa answers in its own order
    listProducts.mockResolvedValue({
      products: [
        makeProduct('prod_a', 'Alpha'),
        makeProduct('prod_b', 'Beta'),
        makeProduct('prod_c', 'Gamma'),
      ],
    })

    const wrapper = await mountPage()

    expect(cards(wrapper).map((c) => c.get('h3').text())).toEqual([
      'Gamma',
      'Alpha',
      'Beta',
    ])
    expect(wrapper.text()).not.toContain(UNAVAILABLE)
    expect(heading(wrapper)).toContain('(3)')
  })

  it('shows the unavailable card, in place, for a product Medusa no longer returns', async () => {
    saved('prod_c', 'prod_gone', 'prod_a')
    listProducts.mockResolvedValue({
      products: [
        makeProduct('prod_a', 'Alpha'),
        makeProduct('prod_c', 'Gamma'),
      ],
    })

    const wrapper = await mountPage()
    const all = cards(wrapper)

    expect(all).toHaveLength(3)
    expect(all[0]!.text()).toContain('Gamma')
    expect(all[1]!.text()).toContain(UNAVAILABLE)
    expect(all[1]!.find('a').exists()).toBe(false)
    expect(all[2]!.text()).toContain('Alpha')
    // the count is what is shown
    expect(heading(wrapper)).toContain('(3)')
  })

  it('removes the unavailable product from the list with its button', async () => {
    saved('prod_gone', 'prod_a')
    listProducts.mockResolvedValue({
      products: [makeProduct('prod_a', 'Alpha')],
    })
    const wrapper = await mountPage()
    expect(heading(wrapper)).toContain('(2)')

    await cards(wrapper)[0]!.get('button').trigger('click')
    await flushPromises()

    expect(useWishlist().productIds.value).toEqual(['prod_a'])
    expect(
      JSON.parse(localStorage.getItem(WISHLIST_STORAGE_KEY) ?? '[]').map(
        (e: { productId: string }) => e.productId,
      ),
    ).toEqual(['prod_a'])
    expect(wrapper.text()).not.toContain(UNAVAILABLE)
    expect(cards(wrapper)).toHaveLength(1)
    expect(heading(wrapper)).toContain('(1)')
  })

  it('shows only unavailable cards, not the empty state, when none of the products exist any more', async () => {
    saved('prod_x', 'prod_y')
    listProducts.mockResolvedValue({ products: [] })

    const wrapper = await mountPage()

    expect(cards(wrapper)).toHaveLength(2)
    expect(wrapper.text()).toContain(UNAVAILABLE)
    expect(wrapper.text()).not.toContain('You have no saved products yet')
    expect(heading(wrapper)).toContain('(2)')
  })

  it('shows the error, not unavailable cards, when the request fails', async () => {
    saved('prod_a', 'prod_b')
    listProducts.mockRejectedValue(new Error('network down'))

    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Could not load your saved products.')
    expect(wrapper.text()).not.toContain(UNAVAILABLE)
    expect(cards(wrapper)).toHaveLength(0)
    expect(heading(wrapper)).not.toContain('(')
  })

  it('shows skeletons, not unavailable cards, while the products load', async () => {
    saved('prod_a')
    let resolve!: (value: { products: StoreProduct[] }) => void
    listProducts.mockReturnValue(
      new Promise((r) => {
        resolve = r
      }),
    )

    const wrapper = await mountPage()

    expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain(UNAVAILABLE)
    expect(heading(wrapper)).not.toContain('(')

    resolve({ products: [makeProduct('prod_a', 'Alpha')] })
    await flushPromises()

    expect(wrapper.find('[aria-busy="true"]').exists()).toBe(false)
    expect(cards(wrapper)).toHaveLength(1)
  })

  it('shows the empty state for an empty list, without asking Medusa', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('You have no saved products yet')
    expect(cards(wrapper)).toHaveLength(0)
    expect(listProducts).not.toHaveBeenCalled()
  })
})
