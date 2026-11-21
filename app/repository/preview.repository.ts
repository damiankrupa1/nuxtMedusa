import type { PreviewSession } from '~/types/preview'
import { PREVIEW_TOKEN_HEADER } from '~/types/preview'

// The draft preview's session check (server/api/preview/session.post.ts).
// The token goes only in the x-preview-token header, never in the URL.
export function previewRepository() {
  return {
    /**
     * When the token expires, or null when the server refuses it (401), has
     * the preview switched off (404) or can't be asked. Never throws.
     */
    async fetchSession(token: string): Promise<PreviewSession | null> {
      try {
        return await $fetch<PreviewSession>('/api/preview/session', {
          method: 'POST',
          headers: { [PREVIEW_TOKEN_HEADER]: token },
          cache: 'no-store',
        })
      } catch (error) {
        // An answer (401, 404, 5xx) is the server's to report. Without one
        // only this side knows; the report is a new error with no cause,
        // because the fetch error carries the request headers and so the
        // token.
        if ((error as { statusCode?: number }).statusCode === undefined) {
          captureError(new Error('Preview session request got no answer'), {
            source: 'preview',
          })
        }
        return null
      }
    },
  }
}
