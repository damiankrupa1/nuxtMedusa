import { PREVIEW_QUERY_PARAM } from '~/types/preview'

// Marks the request when the rendered page opted in with
// `definePageMeta({ cdnCache: true })`. server/plugins/cdn-cache.ts then
// decides whether the response can actually be shared. A preview request
// (?preview) is never marked: it must not be shared, whatever it renders.
export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()

  nuxtApp.hook('app:rendered', ({ ssrContext }) => {
    const route = router.currentRoute.value
    if (
      ssrContext &&
      route.meta.cdnCache &&
      !(PREVIEW_QUERY_PARAM in route.query)
    ) {
      ssrContext.event.context.cdnCache = true
    }
  })
})
