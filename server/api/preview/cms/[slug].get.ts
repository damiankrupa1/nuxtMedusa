import { previewDraftQuerySchema } from '~/types/preview'
import { payloadDraftRepository } from '~~/server/repository/payload.repository'
import { isCmsGlobalSlug } from '~~/server/utils/cms'
import {
  applyPreviewHeaders,
  assertPreviewEnabled,
  resolvePreviewConfig,
} from '~~/server/utils/preview'
import { requirePreviewToken } from '~~/server/utils/preview-token'
import { parseRequestInput } from '~~/server/utils/validation'

// The draft of a Payload global, for a page in preview mode only. The
// browser calls it with the preview token in the x-preview-token header; the
// server asks Payload for `draft=true` with its private API key.
//
// Deliberately a plain defineEventHandler, never defineCachedEventHandler:
// a cached answer would be served to the next caller with the same URL, token
// or not. The response is private, no-store and noindex, and the public
// /api/cms proxy can't ask for a draft at all (see payload.repository.ts), so
// a draft is never stored by Nitro or the CDN.
export default defineEventHandler(async (event) => {
  const config = resolvePreviewConfig(useRuntimeConfig(event), {
    dev: import.meta.dev,
  })
  applyPreviewHeaders(event, config)
  assertPreviewEnabled(config)

  // First, so nothing below (not even which slugs exist) answers without a
  // valid token
  await requirePreviewToken(event, config)

  const slug = getRouterParam(event, 'slug')
  if (!isCmsGlobalSlug(slug)) {
    throw createError({ statusCode: 404, message: 'Unknown CMS global' })
  }
  if (!config.payloadUrl) {
    throw createError({
      statusCode: 503,
      message: 'Payload CMS is not configured',
    })
  }

  const query = parseRequestInput(
    previewDraftQuerySchema,
    getQuery(event),
    'query',
  )

  return payloadDraftRepository(config.payloadUrl, {
    apiKey: config.apiKey,
    apiKeyCollection: config.apiKeyCollection,
  }).fetchDraftGlobal(slug, query)
})
