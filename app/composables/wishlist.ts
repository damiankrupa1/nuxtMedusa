import { productRepository } from '~/repository/product.repository'
import {
  WISHLIST_MAX_ITEMS,
  WISHLIST_STORAGE_KEY,
  type WishlistEntry,
} from '~/types/wishlist'
import {
  addWishlistEntry,
  isInWishlist,
  orderProductsByWishlist,
  parseWishlist,
  removeWishlistEntry,
  serializeWishlist,
} from '~/utils/wishlist'

// The saved products live in this browser only (localStorage). The server
// render never reads them, so every page that shows them renders the same for
// every visitor and stays cacheable: `entries` is empty on the server and
// during hydration, and `loaded` turns true once the browser list is read
// (app/plugins/wishlist.client.ts).
// TODO(#79): a signed-in customer's list should be kept on the backend
// (damiankrupa1/medusaDemo#26) so it follows them to other devices; until then
// the account banner on the wishlist page is the only link to the account.
export const useWishlist = () => {
  const entries = useState<WishlistEntry[]>('wishlist', () => [])
  const loaded = useState('wishlist-loaded', () => false)

  const productIds = computed(() => entries.value.map((e) => e.productId))
  const count = computed(() => entries.value.length)

  function load() {
    if (!import.meta.client) return
    try {
      entries.value = parseWishlist(localStorage.getItem(WISHLIST_STORAGE_KEY))
    } catch {
      // Storage blocked (private mode, site data cleared): the list then only
      // lives until the page is closed.
      entries.value = []
    }
    loaded.value = true
  }

  function persist() {
    try {
      localStorage.setItem(
        WISHLIST_STORAGE_KEY,
        serializeWishlist(entries.value),
      )
    } catch {
      // See load(): saving still works for this visit.
    }
  }

  // A click can come before the plugin has read the stored list; reading it
  // first keeps the earlier entries from being overwritten.
  function ensureLoaded() {
    if (!loaded.value) load()
  }

  function has(productId: string) {
    return isInWishlist(entries.value, productId)
  }

  function add(productId: string) {
    ensureLoaded()
    entries.value = addWishlistEntry(entries.value, productId)
    persist()
  }

  function remove(productId: string) {
    ensureLoaded()
    entries.value = removeWishlistEntry(entries.value, productId)
    persist()
  }

  function toggle(productId: string) {
    ensureLoaded()
    if (has(productId)) remove(productId)
    else add(productId)
  }

  return { entries, loaded, productIds, count, has, add, remove, toggle, load }
}

// The saved products, fetched in the browser only (the list is not known on
// the server) and shown in the order they were saved. The key encodes
// everything the request depends on, as in the other fetchers.
export const useFetchWishlistProducts = () => {
  const { country } = useCountry()
  const { locale } = useI18n()
  const { listProducts } = productRepository()
  const { entries, productIds } = useWishlist()

  const medusaLocale = computed(() => toMedusaLocale(locale.value))

  const { data, status, error, refresh } = useLazyAsyncData(
    () =>
      `wishlist:${productIds.value.join(',')}:${country.value?.region_id}:${medusaLocale.value}`,
    async () => {
      if (!productIds.value.length) return []
      const { products } = await listProducts(
        {
          id: productIds.value,
          region_id: country.value?.region_id,
          limit: WISHLIST_MAX_ITEMS,
        },
        medusaLocale.value,
      )
      return products
    },
    { server: false },
  )

  const products = computed(() =>
    orderProductsByWishlist(data.value ?? [], entries.value),
  )

  return { products, status, error, refresh }
}
