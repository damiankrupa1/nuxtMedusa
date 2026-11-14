import type { z } from 'zod'
import { payloadStubUrl } from '~~/tests/e2e/support/env'
import { expect, test } from '~~/tests/e2e/support/fixtures'
import {
  CMS_GLOBAL_SLUGS,
  CMS_GLOBAL_MAX_DEPTH,
  cmsBrandsSchema,
  cmsCampaignSlidesSchema,
  cmsCategoryTilesSchema,
  cmsFooterContentSchema,
  cmsJournalSectionSchema,
  cmsNavigationSchema,
  cmsShopTheLookSchema,
  cmsStudioStorySchema,
} from '~/types/cms'
import type { CmsGlobalSlug } from '~/types/cms'
import type { StubRequest } from '~~/tests/e2e/support/payload-stub'

// The storefront's same-origin Payload proxy (server/api/cms/[slug].get.ts),
// backed by the local Payload stub the app is built against. No Medusa needed.

// The schema each global is parsed with in cms.repository.ts
const schemas = {
  navigation: cmsNavigationSchema,
  'footer-content': cmsFooterContentSchema,
  'studio-story': cmsStudioStorySchema,
  brands: cmsBrandsSchema,
  'journal-section': cmsJournalSectionSchema,
  'campaign-slides': cmsCampaignSlidesSchema,
  'category-tiles': cmsCategoryTilesSchema,
  'shop-the-look': cmsShopTheLookSchema,
} satisfies Record<CmsGlobalSlug, z.ZodType>

test.describe('Payload proxy: /api/cms/<slug>', () => {
  CMS_GLOBAL_SLUGS.forEach((slug) => {
    test(`serves "${slug}" in the shape the storefront parses`, async ({
      request,
    }) => {
      const response = await request.get(`/api/cms/${slug}`, {
        params: { locale: 'pl', depth: 1 },
      })

      expect(response.status()).toBe(200)
      const parsed = schemas[slug].safeParse(await response.json())
      expect(parsed.error?.issues ?? []).toEqual([])
    })
  })

  test('forwards the locale and depth to Payload', async ({ request }) => {
    const response = await request.get('/api/cms/navigation', {
      params: { locale: 'en', depth: 1 },
    })
    expect(response.status()).toBe(200)

    const log = await request.get(`${payloadStubUrl}/__stub/requests`)
    const forwarded = ((await log.json()) as StubRequest[]).filter(
      ({ path, query }) =>
        path === '/api/globals/navigation' &&
        query.locale === 'en' &&
        query.depth === '1',
    )
    expect(forwarded.length).toBeGreaterThan(0)
  })

  test('answers 404 for a global that is not allow-listed', async ({
    request,
  }) => {
    const response = await request.get('/api/cms/users', {
      params: { locale: 'pl' },
    })

    expect(response.status()).toBe(404)
  })

  test('answers 400 with the issues for a malformed locale', async ({
    request,
  }) => {
    const response = await request.get('/api/cms/navigation', {
      params: { locale: 'not a locale' },
    })

    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.message).toBe('Invalid request query')
    expect(body.data.fieldErrors.locale).toBeDefined()
  })

  test('answers 400 when the locale is missing', async ({ request }) => {
    const response = await request.get('/api/cms/navigation')

    expect(response.status()).toBe(400)
  })

  test('answers 400 for a depth beyond what the storefront reads', async ({
    request,
  }) => {
    const response = await request.get('/api/cms/navigation', {
      params: { locale: 'pl', depth: CMS_GLOBAL_MAX_DEPTH + 1 },
    })

    expect(response.status()).toBe(400)
  })
})
