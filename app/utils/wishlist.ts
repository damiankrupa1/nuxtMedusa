import {
  WISHLIST_MAX_ITEMS,
  wishlistEntrySchema,
  type WishlistEntry,
} from '~/types/wishlist'

// What localStorage holds is user-controlled and may come from an older
// version, so anything that is not a valid entry is dropped instead of
// failing the whole list. Duplicates keep the newest entry; the result is
// newest first and never longer than WISHLIST_MAX_ITEMS.
export function parseWishlist(raw: string | null): WishlistEntry[] {
  if (!raw) return []

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []

  const seen = new Set<string>()
  return parsed
    .map((item) => wishlistEntrySchema.safeParse(item))
    .flatMap((result) => (result.success ? [result.data] : []))
    .sort((a, b) => b.addedAt - a.addedAt)
    .filter((entry) => {
      if (seen.has(entry.productId)) return false
      seen.add(entry.productId)
      return true
    })
    .slice(0, WISHLIST_MAX_ITEMS)
}

export function serializeWishlist(entries: WishlistEntry[]): string {
  return JSON.stringify(entries)
}

export function isInWishlist(entries: WishlistEntry[], productId: string) {
  return entries.some((entry) => entry.productId === productId)
}

// A saved product is not added twice. When the list is full the oldest entry
// makes room, so saving never silently fails.
export function addWishlistEntry(
  entries: WishlistEntry[],
  productId: string,
  now = Date.now(),
): WishlistEntry[] {
  if (isInWishlist(entries, productId)) return entries
  return [{ productId, addedAt: now }, ...entries].slice(0, WISHLIST_MAX_ITEMS)
}

export function removeWishlistEntry(
  entries: WishlistEntry[],
  productId: string,
): WishlistEntry[] {
  return entries.filter((entry) => entry.productId !== productId)
}

// Products come back from Medusa in its own order; the wishlist shows them in
// the order they were saved. A saved id that Medusa no longer returns (the
// product was deleted or unpublished) has no product and is left out.
export function orderProductsByWishlist<T extends { id: string }>(
  products: T[],
  entries: WishlistEntry[],
): T[] {
  const byId = new Map(products.map((product) => [product.id, product]))
  return entries.flatMap((entry) => {
    const product = byId.get(entry.productId)
    return product ? [product] : []
  })
}
