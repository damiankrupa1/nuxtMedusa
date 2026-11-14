// Marks the request when the rendered page opted in with
// `definePageMeta({ cdnCache: true })`. server/plugins/cdn-cache.ts then
// decides whether the response can actually be shared.
//
// A page that failed is never marked. Nitro renders the error page as a second
// request (`/__nuxt_error`) that resolves the failed URL, so its route opts in
// too, and that request looks like a plain 200 to the render hook: the status
// of the failed page (500, or the 404 of `useNotFoundWhenMissing`) is only set
// afterwards, on the response that carries it. That covers the failed render
// itself (`payload.error`) and the error page rendered for it (`ssrContext.error`).
export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()

  nuxtApp.hook('app:rendered', ({ ssrContext }) => {
    if (!ssrContext || ssrContext.error || ssrContext.payload.error) return

    if (router.currentRoute.value.meta.cdnCache) {
      ssrContext.event.context.cdnCache = true
    }
  })
})
