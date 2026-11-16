import type { PreviewSession } from '~/types/preview'
import {
  applyPreviewHeaders,
  assertPreviewEnabled,
  resolvePreviewConfig,
} from '~~/server/utils/preview'
import { requirePreviewToken } from '~~/server/utils/preview-token'

// Checks the preview token the page got in its fragment (sent in the
// x-preview-token header) and answers when it expires, so the page can show
// the preview banner, or a 401. A POST with a custom header: no shared cache
// stores it, and another site can't call it without a CORS preflight, which
// this storefront doesn't answer.
export default defineEventHandler(async (event): Promise<PreviewSession> => {
  const config = resolvePreviewConfig(useRuntimeConfig(event), {
    dev: import.meta.dev,
  })
  applyPreviewHeaders(event, config)
  assertPreviewEnabled(config)

  const { exp } = await requirePreviewToken(event, config)

  return { expiresAt: new Date(exp * 1000).toISOString() }
})
