import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'nuxt/app'

import { useWishlist } from '~/composables/wishlist'
import { WISHLIST_STORAGE_KEY } from '~/types/wishlist'

const stored = () =>
  JSON.parse(localStorage.getItem(WISHLIST_STORAGE_KEY) ?? 'null')

describe('useWishlist in Nuxt', () => {
  beforeEach(() => {
    localStorage.clear()
    useState('wishlist').value = []
    useState('wishlist-loaded').value = false
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts empty and not loaded, like the server render', () => {
    const wishlist = useWishlist()

    expect(wishlist.entries.value).toEqual([])
    expect(wishlist.loaded.value).toBe(false)
    expect(wishlist.count.value).toBe(0)
  })

  it('reads the saved list from the browser once loaded', () => {
    localStorage.setItem(
      WISHLIST_STORAGE_KEY,
      JSON.stringify([
        { productId: 'prod_1', addedAt: 10 },
        { productId: 'prod_2', addedAt: 20 },
      ]),
    )
    const wishlist = useWishlist()

    wishlist.load()

    expect(wishlist.loaded.value).toBe(true)
    expect(wishlist.productIds.value).toEqual(['prod_2', 'prod_1'])
    expect(wishlist.has('prod_1')).toBe(true)
    expect(wishlist.has('prod_9')).toBe(false)
  })

  it('saves a product, newest first, and writes it to the browser', () => {
    const wishlist = useWishlist()

    wishlist.add('prod_1')
    wishlist.add('prod_2')

    expect(wishlist.productIds.value).toEqual(['prod_2', 'prod_1'])
    expect(stored().map((e: { productId: string }) => e.productId)).toEqual([
      'prod_2',
      'prod_1',
    ])
  })

  it('does not lose the stored list when a click comes before it was read', () => {
    localStorage.setItem(
      WISHLIST_STORAGE_KEY,
      JSON.stringify([{ productId: 'prod_old', addedAt: 5 }]),
    )
    const wishlist = useWishlist()

    wishlist.toggle('prod_new')

    expect(wishlist.productIds.value).toEqual(['prod_new', 'prod_old'])
    expect(stored()).toHaveLength(2)
  })

  it('toggles a product in and out', () => {
    const wishlist = useWishlist()

    wishlist.toggle('prod_1')
    expect(wishlist.has('prod_1')).toBe(true)

    wishlist.toggle('prod_1')
    expect(wishlist.has('prod_1')).toBe(false)
    expect(stored()).toEqual([])
  })

  it('removes a product', () => {
    const wishlist = useWishlist()
    wishlist.add('prod_1')
    wishlist.add('prod_2')

    wishlist.remove('prod_1')

    expect(wishlist.productIds.value).toEqual(['prod_2'])
    expect(stored()).toHaveLength(1)
  })

  it('shares one list between every caller', () => {
    const first = useWishlist()
    const second = useWishlist()

    first.add('prod_1')

    expect(second.has('prod_1')).toBe(true)
  })

  it('still works for this visit when the browser refuses to store it', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    const wishlist = useWishlist()

    expect(() => wishlist.add('prod_1')).not.toThrow()
    expect(wishlist.has('prod_1')).toBe(true)
    expect(wishlist.loaded.value).toBe(true)
  })
})
