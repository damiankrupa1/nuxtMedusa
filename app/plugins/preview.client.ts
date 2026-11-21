import { PAYLOAD_LIVE_PREVIEW_MESSAGE, PREVIEW_STATUS } from '~/types/preview'

// Browser side of the draft preview (#53, "Draft preview" in CLAUDE.md). The
// entry route redirects an editor to `/pl?preview=1#token=<JWT>`; this plugin
// takes the token out of the fragment, removes it from the address bar and,
// once the app is ready, checks it with the server and starts the preview
// (usePreview()). From then on the CMS composables fetch drafts from
// /api/preview/cms with the token in a header. The token is kept in
// sessionStorage for reloads of this tab; it never goes into a cookie or a
// URL the server sees.
//
// Nothing here runs on the server, and only the URL cleaning runs before
// hydration has finished: the server render (also of a `?preview` page) is
// always the published one, and the hydration matches it.

// Payload's autosave can send a save event every second or so; one refetch
// of the drafts per burst is enough.
const LIVE_PREVIEW_REFRESH_DELAY_MS = 300

const removeTokenFromAddressBar = () => removePreviewTokenFromAddressBar(window)

export default defineNuxtPlugin({
  name: 'preview',
  // Before nuxt:router (`enforce: 'pre'`, order -20), which reads the URL
  // when it is created: the router, the route middleware and anything that
  // reads the route then never see the token.
  order: -25,
  setup(nuxtApp) {
    const handedOver = readPreviewTokenFromHash(window.location.hash)
    if (handedOver) {
      removeTokenFromAddressBar()
      // Had the router read the URL first, its initial navigation (on
      // app:created) would write the token back; this runs after it then.
      nuxtApp.hooks.hookOnce('app:created', removeTokenFromAddressBar)
    }

    const requested =
      handedOver !== null || hasPreviewQuery(window.location.search)
    const stored = readStoredPreviewSession()
    if (!requested && !stored) return

    onNuxtReady(() =>
      nuxtApp.runWithContext(async () => {
        const preview = usePreview()
        const payloadOrigin = toPayloadOrigin(
          useRuntimeConfig().public.payloadUrl,
        )

        // The banner says when the token ran out, before a fetch gets a 401
        let expiryTimer: ReturnType<typeof setTimeout> | undefined
        watch(
          preview.state,
          (state) => {
            clearTimeout(expiryTimer)
            if (state.status === PREVIEW_STATUS.active) {
              expiryTimer = setTimeout(
                preview.expire,
                msUntilPreviewExpiry(state.expiresAt),
              )
            }
          },
          { immediate: true },
        )

        await preview.start(handedOver ?? stored?.token ?? null)

        if (
          preview.state.value.status === PREVIEW_STATUS.active &&
          payloadOrigin
        ) {
          connectLivePreview(payloadOrigin, () => {
            if (preview.state.value.status !== PREVIEW_STATUS.active) return
            const draftKeys = Object.keys(nuxtApp.payload.data).filter(
              isPreviewCacheKey,
            )
            if (draftKeys.length) {
              // Failures end up in each section's own state, see fetchGlobal()
              void nuxtApp.runWithContext(() => refreshNuxtData(draftKeys))
            }
          })
        }
      }),
    )
  },
})

// Payload's Live Preview (server-side flavour, as in
// @payloadcms/live-preview's ready() and isDocumentEvent()): the page tells
// the Payload window it is ready, and refetches the drafts whenever Payload
// reports a save. Messages are accepted only from the Payload origin and the
// window the page announced itself to, and their content is not used.
// Payload's unsaved form state (`payload-live-preview` messages with data) is
// not merged in; the preview shows what was last saved as a draft.
function connectLivePreview(payloadOrigin: string, onSave: () => void) {
  const host = getLivePreviewHost(window)
  if (!host) return

  let refreshTimer: ReturnType<typeof setTimeout> | undefined
  window.addEventListener('message', (event) => {
    if (!isPayloadDocumentEvent(event, payloadOrigin, host)) return
    clearTimeout(refreshTimer)
    refreshTimer = setTimeout(onSave, LIVE_PREVIEW_REFRESH_DELAY_MS)
  })

  host.postMessage(
    { type: PAYLOAD_LIVE_PREVIEW_MESSAGE, ready: true },
    payloadOrigin,
  )
}
