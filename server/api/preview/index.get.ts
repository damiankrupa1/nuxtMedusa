import type { StoreRegionListResponse } from '@medusajs/types'

import { previewEntryQuerySchema } from '~/types/preview'
import { getCountriesFromRegions } from '~/utils/country'
import { toCountryCodes } from '~/utils/seo'
import {
  applyPreviewHeaders,
  assertPreviewEnabled,
  buildPreviewEntryLocation,
  matchesPreviewEntry,
  resolvePreviewConfig,
  resolvePreviewCountry,
} from '~~/server/utils/preview'
import { verifyPreviewToken } from '~~/server/utils/preview-token'
import { parseRequestInput } from '~~/server/utils/validation'

// Entry link of the draft preview, opened by Payload's Preview button and
// Live Preview pane: GET /api/preview?token=<JWT>&locale=<en|pl>&path=/&global=<slug>
// (the contract is in the payload-backend-todo skill). It checks the token
// and redirects to the page in that locale with the preview marker,
// `/pl?preview=1#token=<JWT>`. The token moves to the fragment there, so the
// page request and everything after it carry no token to the server; only
// this one request has it in its query string, because that is how Payload
// builds the link.
//
// Never cached (plain defineEventHandler, private, no-store), and it renders
// nothing: the drafts are fetched by the browser from /api/preview/cms.
export default defineEventHandler(async (event) => {
  const config = resolvePreviewConfig(useRuntimeConfig(event), {
    dev: import.meta.dev,
  })
  applyPreviewHeaders(event, config)
  assertPreviewEnabled(config)

  // A 400 with the issues for a missing token, an unknown locale or a path
  // that isn't a plain storefront path (it ends up in the redirect)
  const query = parseRequestInput(
    previewEntryQuerySchema,
    getQuery(event),
    'query',
  )

  const claims = await verifyPreviewToken(query.token, config.secret)
  if (!claims || !matchesPreviewEntry(claims, query)) {
    // Plain text rather than a thrown error: this request is a navigation in
    // Payload's preview frame, and Nitro's JSON error answer would replace the
    // preview's frame-ancestors with 'none', leaving the editor a blank frame
    // instead of the reason. It is never a fallback to the published page.
    setResponseStatus(event, 401)
    setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
    return 'This preview link is invalid or has expired. Open the preview again from Payload.'
  }

  // The regions handler reports its own failures; without regions the
  // default country is used, and the region middleware takes it from there.
  const countryCodes = await event
    .$fetch<StoreRegionListResponse>('/api/regions')
    .then(({ regions }) => toCountryCodes(getCountriesFromRegions(regions)))
    .catch(() => [])
  const countryCode = resolvePreviewCountry(
    query.locale,
    countryCodes,
    useAppConfig(event).defaultCountry,
  )

  return sendRedirect(
    event,
    buildPreviewEntryLocation(countryCode, query.path, query.token),
    302,
  )
})
