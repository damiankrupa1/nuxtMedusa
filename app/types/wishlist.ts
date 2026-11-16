import { z } from 'zod'

// localStorage key of the saved-products list (see app/composables/wishlist.ts).
export const WISHLIST_STORAGE_KEY = 'wishlist'

// Medusa's product list answers 50 items by default, and one request fetches
// the whole wishlist: the cap keeps it to one page.
export const WISHLIST_MAX_ITEMS = 50

export const wishlistEntrySchema = z.object({
  productId: z.string().min(1),
  // Epoch milliseconds; the list is shown newest first ("Ostatnio dodane").
  addedAt: z.number().int().nonnegative(),
})

export type WishlistEntry = z.infer<typeof wishlistEntrySchema>
