import { describe, expect, it } from 'vitest'

import { WISHLIST_MAX_ITEMS } from '~/types/wishlist'
import {
  addWishlistEntry,
  isInWishlist,
  parseWishlist,
  removeWishlistEntry,
  resolveWishlistItems,
  serializeWishlist,
} from '~/utils/wishlist'

const entry = (productId: string, addedAt: number) => ({ productId, addedAt })

describe('parseWishlist', () => {
  it('is empty without a stored value or with one that is not JSON', () => {
    expect(parseWishlist(null)).toEqual([])
    expect(parseWishlist('')).toEqual([])
    expect(parseWishlist('{not json')).toEqual([])
  })

  it('is empty when the stored value is not a list', () => {
    expect(parseWishlist('{"productId":"prod_1","addedAt":1}')).toEqual([])
    expect(parseWishlist('"prod_1"')).toEqual([])
    expect(parseWishlist('null')).toEqual([])
  })

  it('reads what serializeWishlist wrote', () => {
    const entries = [entry('prod_2', 20), entry('prod_1', 10)]

    expect(parseWishlist(serializeWishlist(entries))).toEqual(entries)
  })

  it('drops entries that are not valid and keeps the rest', () => {
    const raw = JSON.stringify([
      entry('prod_1', 10),
      { productId: '', addedAt: 5 },
      { productId: 'prod_2' },
      { productId: 'prod_3', addedAt: -1 },
      { productId: 4, addedAt: 5 },
      'prod_5',
      null,
      entry('prod_6', 30),
    ])

    expect(parseWishlist(raw)).toEqual([
      entry('prod_6', 30),
      entry('prod_1', 10),
    ])
  })

  it('shows the newest first and keeps one entry per product', () => {
    const raw = JSON.stringify([
      entry('prod_1', 10),
      entry('prod_2', 30),
      entry('prod_1', 20),
    ])

    expect(parseWishlist(raw)).toEqual([
      entry('prod_2', 30),
      entry('prod_1', 20),
    ])
  })

  it('keeps no more than the limit, dropping the oldest', () => {
    const raw = JSON.stringify(
      Array.from({ length: WISHLIST_MAX_ITEMS + 5 }, (_, i) =>
        entry(`prod_${i}`, i),
      ),
    )
    const parsed = parseWishlist(raw)

    expect(parsed).toHaveLength(WISHLIST_MAX_ITEMS)
    expect(parsed[0]?.productId).toBe(`prod_${WISHLIST_MAX_ITEMS + 4}`)
    expect(isInWishlist(parsed, 'prod_0')).toBe(false)
  })
})

describe('addWishlistEntry', () => {
  it('puts the new product first', () => {
    expect(addWishlistEntry([entry('prod_1', 10)], 'prod_2', 20)).toEqual([
      entry('prod_2', 20),
      entry('prod_1', 10),
    ])
  })

  it('does not save a product twice', () => {
    const entries = [entry('prod_1', 10)]

    expect(addWishlistEntry(entries, 'prod_1', 99)).toBe(entries)
  })

  it('lets the oldest entry make room when the list is full', () => {
    const full = Array.from({ length: WISHLIST_MAX_ITEMS }, (_, i) =>
      entry(`prod_${i}`, WISHLIST_MAX_ITEMS - i),
    )
    const next = addWishlistEntry(full, 'prod_new', 1000)

    expect(next).toHaveLength(WISHLIST_MAX_ITEMS)
    expect(next[0]).toEqual(entry('prod_new', 1000))
    expect(isInWishlist(next, `prod_${WISHLIST_MAX_ITEMS - 1}`)).toBe(false)
  })

  it('does not change the list it was given', () => {
    const entries = [entry('prod_1', 10)]
    addWishlistEntry(entries, 'prod_2', 20)

    expect(entries).toEqual([entry('prod_1', 10)])
  })
})

describe('removeWishlistEntry and isInWishlist', () => {
  const entries = [entry('prod_2', 20), entry('prod_1', 10)]

  it('removes only that product', () => {
    expect(removeWishlistEntry(entries, 'prod_2')).toEqual([
      entry('prod_1', 10),
    ])
  })

  it('leaves the list alone for a product that is not saved', () => {
    expect(removeWishlistEntry(entries, 'prod_9')).toEqual(entries)
  })

  it('tells whether a product is saved', () => {
    expect(isInWishlist(entries, 'prod_1')).toBe(true)
    expect(isInWishlist(entries, 'prod_9')).toBe(false)
  })
})

describe('resolveWishlistItems', () => {
  it('follows the order the products were saved in', () => {
    const entries = [entry('c', 30), entry('a', 20), entry('b', 10)]
    const products = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]

    expect(resolveWishlistItems(entries, products, ['c', 'a', 'b'])).toEqual([
      { productId: 'c', product: { id: 'c' } },
      { productId: 'a', product: { id: 'a' } },
      { productId: 'b', product: { id: 'b' } },
    ])
  })

  it('keeps a saved product Medusa no longer returns, without a product, in its place', () => {
    const entries = [entry('c', 30), entry('gone', 20), entry('a', 10)]

    expect(
      resolveWishlistItems(
        entries,
        [{ id: 'a' }, { id: 'c' }],
        ['c', 'gone', 'a'],
      ),
    ).toEqual([
      { productId: 'c', product: { id: 'c' } },
      { productId: 'gone', product: null },
      { productId: 'a', product: { id: 'a' } },
    ])
  })

  it('ignores a product that is not saved', () => {
    expect(
      resolveWishlistItems([entry('a', 1)], [{ id: 'x' }], ['a', 'x']),
    ).toEqual([{ productId: 'a', product: null }])
  })

  it('does not take a product saved after the request for a missing one', () => {
    const entries = [entry('new', 30), entry('a', 20)]

    expect(resolveWishlistItems(entries, [{ id: 'a' }], ['a'])).toEqual([
      { productId: 'a', product: { id: 'a' } },
    ])
  })

  it('is empty for an empty list', () => {
    expect(resolveWishlistItems([], [{ id: 'a' }], [])).toEqual([])
  })
})
