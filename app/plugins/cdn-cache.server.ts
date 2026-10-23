// Marks the request when the rendered page opted in with
// `definePageMeta({ cdnCache: true })`. server/plugins/cdn-cache.ts then
// decides whether the response can actually be shared.
export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()

  nuxtApp.hook('app:rendered', ({ ssrContext }) => {
    if (ssrContext && router.currentRoute.value.meta.cdnCache) {
      ssrContext.event.context.cdnCache = true
    }
  })
})
