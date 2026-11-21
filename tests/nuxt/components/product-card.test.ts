import type { StoreProduct } from '@medusajs/types'
import { defineComponent, h } from 'vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { useState } from 'nuxt/app'

import ProductCard from '~/components/product/card.vue'
import { useWishlist } from '~/composables/wishlist'
import type { BaseRegionCountryWithRegionId } from '~/types/country'
import { WISHLIST_STORAGE_KEY } from '~/types/wishlist'

const product = {
  id: 'prod_1',
  title: 'Merino crew-neck sweater',
  handle: 'merino-crew-neck',
  material: '100% merino wool',
  thumbnail: null,
  options: [],
  variants: [
    {
      id: 'var_1',
      calculated_price: {
        calculated_amount: 39900,
        original_amount: 39900,
        currency_code: 'pln',
      },
    },
  ],
} as unknown as StoreProduct

const mountCard = (props: { product?: StoreProduct; withSaveIcon?: boolean }) =>
  mountSuspended(
    defineComponent({
      setup() {
        useState<BaseRegionCountryWithRegionId | null>('country').value = {
          iso_2: 'pl',
          region_id: 'reg_pl',
        } as BaseRegionCountryWithRegionId

        return () => h(ProductCard, props)
      },
    }),
    { global: { stubs: { NuxtImg: true } } },
  )

const heartOf = (wrapper: Awaited<ReturnType<typeof mountCard>>) =>
  wrapper.get('button[aria-pressed]')

describe('product card heart in Nuxt', () => {
  beforeEach(() => {
    localStorage.clear()
    useState('wishlist').value = []
    useState('wishlist-loaded').value = false
  })

  it('shows no heart without the withSaveIcon flag, and the card is unchanged', async () => {
    const wrapper = await mountCard({ product })

    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.get('a').attributes('href')).toBe(
      '/pl/products/merino-crew-neck',
    )
    expect(wrapper.text()).toContain('Merino crew-neck sweater')
  })

  it('shows no heart on the loading skeleton of a card', async () => {
    const wrapper = await mountCard({ withSaveIcon: true })

    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('starts with an empty heart whose name includes the product title', async () => {
    const wrapper = await mountCard({ product, withSaveIcon: true })
    const heart = heartOf(wrapper)

    expect(heart.attributes('aria-pressed')).toBe('false')
    expect(heart.attributes('aria-label')).toBe(
      'Add Merino crew-neck sweater to favourites',
    )
    expect(heart.get('svg').attributes('fill')).toBe('none')
  })

  it('saves and removes the product, updating the pressed state and the name', async () => {
    const wrapper = await mountCard({ product, withSaveIcon: true })

    await heartOf(wrapper).trigger('click')

    expect(useWishlist().has('prod_1')).toBe(true)
    expect(heartOf(wrapper).attributes('aria-pressed')).toBe('true')
    expect(heartOf(wrapper).attributes('aria-label')).toBe(
      'Remove Merino crew-neck sweater from favourites',
    )
    expect(heartOf(wrapper).get('svg').attributes('fill')).toBe('currentColor')
    expect(
      JSON.parse(localStorage.getItem(WISHLIST_STORAGE_KEY) ?? '[]'),
    ).toHaveLength(1)

    await heartOf(wrapper).trigger('click')

    expect(useWishlist().has('prod_1')).toBe(false)
    expect(heartOf(wrapper).attributes('aria-pressed')).toBe('false')
    expect(localStorage.getItem(WISHLIST_STORAGE_KEY)).toBe('[]')
  })

  it('shows the saved state once the stored list is loaded', async () => {
    localStorage.setItem(
      WISHLIST_STORAGE_KEY,
      JSON.stringify([{ productId: 'prod_1', addedAt: 10 }]),
    )
    const wrapper = await mountCard({ product, withSaveIcon: true })

    // before the list is read (the server render, hydration) it is empty
    expect(heartOf(wrapper).attributes('aria-pressed')).toBe('false')

    useWishlist().load()
    await wrapper.vm.$nextTick()

    expect(heartOf(wrapper).attributes('aria-pressed')).toBe('true')
  })

  it('does not lose the stored list when the heart is clicked before it is read', async () => {
    localStorage.setItem(
      WISHLIST_STORAGE_KEY,
      JSON.stringify([{ productId: 'prod_old', addedAt: 5 }]),
    )
    const wrapper = await mountCard({ product, withSaveIcon: true })

    await heartOf(wrapper).trigger('click')

    expect(useWishlist().productIds.value).toEqual(['prod_1', 'prod_old'])
  })

  it('keeps the heart out of the link, so no interactive element is nested', async () => {
    const wrapper = await mountCard({ product, withSaveIcon: true })

    // no button, link or form control inside an anchor (checked on the markup)
    expect(wrapper.find('a button, a a, a input, a select').exists()).toBe(
      false,
    )
    expect(wrapper.html()).not.toMatch(/<a\b[^>]*>(?:(?!<\/a>)[\s\S])*<button/)
    // the heart and the link are siblings inside the card's container
    const heart = heartOf(wrapper).element
    const link = wrapper.get('a').element
    expect(heart.closest('a')).toBeNull()
    expect(heart.parentElement).toBe(link.parentElement?.parentElement)
  })

  it('does not follow the link when the heart is clicked', async () => {
    const wrapper = await mountCard({ product, withSaveIcon: true })
    const link = wrapper.get('a').element
    let linkClicks = 0
    link.addEventListener('click', () => linkClicks++)

    await heartOf(wrapper).trigger('click')

    expect(linkClicks).toBe(0)
  })
})
