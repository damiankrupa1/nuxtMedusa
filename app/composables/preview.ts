import { previewRepository } from '~/repository/preview.repository'
import type { PreviewState } from '~/types/preview'
import { PREVIEW_QUERY_PARAM, PREVIEW_STATUS } from '~/types/preview'

// State of the draft preview in this browser tab (#53, "Draft preview" in
// CLAUDE.md). It is `off` on the server and during hydration: only
// app/plugins/preview.client.ts starts it, once the app is ready, so the
// server render and the hydrated markup never depend on it. The CMS
// composables read it to pick the draft and its own cache key.
export const usePreview = () => {
  const nuxtApp = useNuxtApp()
  const router = useRouter()
  const state = useState<PreviewState>('preview', () => ({
    status: PREVIEW_STATUS.off,
  }))

  // Drafts (or, once expired, nothing) instead of the published content
  const isPreview = computed(() => state.value.status !== PREVIEW_STATUS.off)
  const previewToken = computed(() =>
    state.value.status === PREVIEW_STATUS.active ? state.value.token : null,
  )

  function setExpired() {
    state.value = { status: PREVIEW_STATUS.expired }
    forgetPreviewSession()
  }

  /**
   * Checks the token with the server and starts the preview, or shows it as
   * expired: a refused token, or no token at all on a `?preview` page.
   */
  async function start(token: string | null) {
    const session = token ? await previewRepository().fetchSession(token) : null
    if (!token || !session) {
      setExpired()
      return
    }

    state.value = {
      status: PREVIEW_STATUS.active,
      token,
      expiresAt: session.expiresAt,
    }
    storePreviewSession({ token, expiresAt: session.expiresAt })
  }

  /** Ends an active preview whose token ran out or was refused (401). */
  function expire() {
    if (state.value.status === PREVIEW_STATUS.active) setExpired()
  }

  /**
   * Leaves the preview: the drafts are dropped from the cache first (so the
   * published keys can't start from a draft), then the state and the stored
   * token, and `?preview` leaves the URL. The CMS composables then fetch the
   * published content again.
   */
  async function exit() {
    // clearNuxtData() is synchronous; the context makes it work from a click
    void nuxtApp.runWithContext(() => clearNuxtData(isPreviewCacheKey))
    state.value = { status: PREVIEW_STATUS.off }
    forgetPreviewSession()

    const route = router.currentRoute.value
    if (!(PREVIEW_QUERY_PARAM in route.query)) return

    const query = Object.fromEntries(
      Object.entries(route.query).filter(
        ([name]) => name !== PREVIEW_QUERY_PARAM,
      ),
    )
    await router.replace({ path: route.path, query, hash: route.hash })
  }

  return { state, isPreview, previewToken, start, expire, exit }
}
