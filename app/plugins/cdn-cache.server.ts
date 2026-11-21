import { PREVIEW_QUERY_PARAM } from '~/types/preview'

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
//
// Nor is a page whose data didn't load. A failed `useLazyAsyncData` doesn't
// fail the render: the page answers 200 with empty sections (e.g. Medusa
// down), and only `payload._errors` records it (one entry per key, undefined
// while it succeeded). Such a page is still served, but never shared (#75). A
// missing handle is not a failure: its fetch succeeds with `null` and
// `useNotFoundWhenMissing` answers 404, covered by `payload.error` above.
//
// A preview request (?preview) is never marked either: it must not be shared,
// whatever it renders.
export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()

  nuxtApp.hook('app:rendered', ({ ssrContext }) => {
    if (!ssrContext || ssrContext.error || ssrContext.payload.error) return
    if (Object.values(ssrContext.payload._errors ?? {}).some(Boolean)) return

    const route = router.currentRoute.value
    if (route.meta.cdnCache && !(PREVIEW_QUERY_PARAM in route.query)) {
      ssrContext.event.context.cdnCache = true
    }
  })
})
