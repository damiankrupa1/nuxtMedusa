import { WISHLIST_STORAGE_KEY } from '~/types/wishlist'

// Reads the saved products once the app has finished hydrating (never during
// the server render or the hydration itself, so the markup matches), and
// follows changes made in another tab. `app:mounted` is too early: the page is
// an async component, so its hydration can still be running then.
export default defineNuxtPlugin(() => {
  const { load } = useWishlist()

  onNuxtReady(load)

  window.addEventListener('storage', (event) => {
    if (event.key === WISHLIST_STORAGE_KEY || event.key === null) load()
  })
})
