import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ZodError } from 'zod'

import { cmsRepository } from '~/repository/cms.repository'
import type { CmsGlobalSlug } from '~/types/cms'
import { isPreviewUnauthorizedError } from '~/utils/preview'
import { resetReportedOnce } from '~/utils/report-once'
import { payloadGlobals, payloadImage } from '~~/tests/fixtures/cms'

type Repository = ReturnType<typeof cmsRepository>

describe('cms repository', () => {
  const fetchMock = vi.fn<(...args: unknown[]) => Promise<unknown>>()
  const captureError = vi.fn()
  const config = { public: { payloadUrl: 'https://cms.example.com' } }

  Object.assign(globalThis, {
    $fetch: fetchMock,
    useRuntimeConfig: () => config,
    captureError,
  })

  beforeEach(() => {
    vi.clearAllMocks()
    resetReportedOnce()
    config.public.payloadUrl = 'https://cms.example.com'
  })

  const fetchers: [keyof Repository, CmsGlobalSlug, string, number][] = [
    ['fetchNavigation', 'navigation', 'pl', 0],
    ['fetchFooterContent', 'footer-content', 'en', 0],
    ['fetchStudioStory', 'studio-story', 'pl', 1],
    ['fetchBrands', 'brands', 'en', 0],
    ['fetchJournalSection', 'journal-section', 'pl', 1],
    ['fetchCampaignSlides', 'campaign-slides', 'pl', 1],
    ['fetchCategoryTiles', 'category-tiles', 'pl', 1],
    ['fetchShopTheLook', 'shop-the-look', 'en', 1],
  ]

  it.each(fetchers)(
    '%s fetches the %s global with locale %s and depth %d',
    async (fetcher, slug, locale, depth) => {
      fetchMock.mockResolvedValue(payloadGlobals[slug])

      const result = await cmsRepository()[fetcher](locale)

      expect(fetchMock).toHaveBeenCalledWith(`/api/cms/${slug}`, {
        query: { locale, depth },
      })
      expect(result).not.toBeNull()
      expect(captureError).not.toHaveBeenCalled()
    },
  )

  it('returns only the contract fields, without Payload ids and timestamps', async () => {
    fetchMock.mockResolvedValue(payloadGlobals.navigation)

    const result = await cmsRepository().fetchNavigation('pl')

    expect(result).toEqual({ primaryNav: [{ label: 'New in', url: '/store' }] })
  })

  it('populates images with their url and alt only', async () => {
    fetchMock.mockResolvedValue(payloadGlobals['studio-story'])

    const result = await cmsRepository().fetchStudioStory('pl')

    expect(result?.image).toEqual({
      url: payloadImage.url,
      alt: payloadImage.alt,
    })
  })

  it('reports and swallows a failure without an answer (network, abort) instead of breaking the page', async () => {
    const error = new TypeError('fetch failed')
    fetchMock.mockRejectedValue(error)

    const result = await cmsRepository().fetchNavigation('pl')

    expect(result).toBeNull()
    expect(captureError).toHaveBeenCalledTimes(1)
    expect(captureError).toHaveBeenCalledWith(error, {
      source: 'payload',
      global: 'navigation',
    })
  })

  it.each([502, 503, 400, 404])(
    'swallows the proxy answering %i without reporting it again: the server already did',
    async (statusCode) => {
      fetchMock.mockRejectedValue(
        Object.assign(new Error('Payload CMS request failed'), { statusCode }),
      )

      const result = await cmsRepository().fetchNavigation('pl')

      expect(result).toBeNull()
      expect(captureError).not.toHaveBeenCalled()
    },
  )

  it.each([
    ['a renamed field', { mainNav: [{ label: 'New in', url: '/store' }] }],
    ['a null field', { primaryNav: [{ label: null, url: '/store' }] }],
    ['an empty global', {}],
    ['an HTML error page', '<html>Bad gateway</html>'],
  ])('reports %s and treats the global as missing', async (_case, body) => {
    fetchMock.mockResolvedValue(body)

    const result = await cmsRepository().fetchNavigation('pl')

    expect(result).toBeNull()
    expect(captureError).toHaveBeenCalledTimes(1)
    const [error, context] = captureError.mock.calls[0] as [Error, object]
    expect(error.message).toContain('Payload global "navigation"')
    expect(error.cause).toBeInstanceOf(ZodError)
    expect(context).toEqual({
      source: 'payload',
      global: 'navigation',
      type: 'invalid_response',
      issues: expect.arrayContaining([
        expect.objectContaining({
          code: expect.any(String),
          path: expect.any(String),
          message: expect.any(String),
        }),
      ]),
    })
  })

  it('reports the same broken global once, not on every render', async () => {
    fetchMock.mockResolvedValue({})

    await cmsRepository().fetchNavigation('pl')
    await cmsRepository().fetchNavigation('pl')
    await cmsRepository().fetchNavigation('en')

    expect(captureError).toHaveBeenCalledTimes(1)
  })

  it('reports a different broken global, and a different failure of the same one', async () => {
    fetchMock.mockResolvedValue({})
    await cmsRepository().fetchNavigation('pl')
    await cmsRepository().fetchBrands('pl')
    fetchMock.mockResolvedValue({ primaryNav: [{ label: 'New in', url: 5 }] })
    await cmsRepository().fetchNavigation('pl')

    expect(captureError).toHaveBeenCalledTimes(3)
    expect(captureError.mock.calls.map(([, context]) => context)).toEqual([
      expect.objectContaining({ global: 'navigation' }),
      expect.objectContaining({ global: 'brands' }),
      expect.objectContaining({
        global: 'navigation',
        issues: [expect.objectContaining({ path: 'primaryNav.0.url' })],
      }),
    ])
  })

  it('says which field is wrong without carrying the received content', async () => {
    fetchMock.mockResolvedValue({
      primaryNav: [{ label: 'secret@example.com', url: 5 }],
    })

    await cmsRepository().fetchNavigation('pl')

    const [error, context] = captureError.mock.calls[0] as [Error, object]
    const everything = JSON.stringify([
      error.message,
      (error.cause as Error).message,
      context,
    ])
    expect(everything).toContain('primaryNav.0.url')
    expect(everything).not.toContain('secret@example.com')
  })

  it('rejects an image fetched without depth (a bare Media id)', async () => {
    fetchMock.mockResolvedValue({
      ...payloadGlobals['studio-story'],
      image: payloadImage.id,
    })

    const result = await cmsRepository().fetchStudioStory('pl')

    expect(result).toBeNull()
    expect(captureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        global: 'studio-story',
        type: 'invalid_response',
      }),
    )
  })

  it('returns null without calling Payload when no URL is configured', async () => {
    config.public.payloadUrl = ''

    const result = await cmsRepository().fetchFooterContent('en')

    expect(result).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  describe('in draft preview mode', () => {
    const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl'

    it.each(fetchers)(
      '%s fetches the draft of %s from the uncached preview route, with the token in a header',
      async (fetcher, slug, locale, depth) => {
        fetchMock.mockResolvedValue({
          ...payloadGlobals[slug],
          _status: 'draft',
        })

        const result = await cmsRepository()[fetcher](locale, { token })

        expect(fetchMock).toHaveBeenCalledTimes(1)
        expect(fetchMock).toHaveBeenCalledWith(`/api/preview/cms/${slug}`, {
          query: { locale, depth },
          headers: { 'x-preview-token': token },
          cache: 'no-store',
        })
        expect(result).not.toBeNull()
        expect(result).not.toHaveProperty('_status')
      },
    )

    it('never puts the token in the URL or the query', async () => {
      fetchMock.mockResolvedValue(payloadGlobals.navigation)

      await cmsRepository().fetchNavigation('pl', { token })

      const [url, options] = fetchMock.mock.calls[0] as [
        string,
        { query: object },
      ]
      expect(url).not.toContain(token)
      expect(JSON.stringify(options.query)).not.toContain(token)
    })

    it('fetches nothing, not even the published version, once the preview has expired', async () => {
      const result = await cmsRepository().fetchNavigation('pl', {
        token: null,
      })

      expect(result).toBeNull()
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('throws a new error without the request when the token is refused (401)', async () => {
      fetchMock.mockRejectedValue(
        Object.assign(new Error('Unauthorized'), {
          statusCode: 401,
          options: { headers: { 'x-preview-token': token } },
        }),
      )

      const error = await cmsRepository()
        .fetchNavigation('pl', { token })
        .catch((thrown: unknown) => thrown)

      expect(isPreviewUnauthorizedError(error)).toBe(true)
      expect(JSON.stringify(error)).not.toContain(token)
      expect((error as Error).cause).toBeUndefined()
      expect(captureError).not.toHaveBeenCalled()
      // No retry against the published proxy
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it.each([404, 502, 503])(
      'treats the preview route answering %i as no content, without a published fallback or a second report',
      async (statusCode) => {
        fetchMock.mockRejectedValue(
          Object.assign(new Error('failed'), { statusCode }),
        )

        const result = await cmsRepository().fetchNavigation('pl', { token })

        expect(result).toBeNull()
        expect(fetchMock).toHaveBeenCalledTimes(1)
        expect(captureError).not.toHaveBeenCalled()
      },
    )

    it('reports a draft request without an answer, without the token', async () => {
      fetchMock.mockRejectedValue(
        Object.assign(new TypeError('fetch failed'), {
          options: { headers: { 'x-preview-token': token } },
        }),
      )

      const result = await cmsRepository().fetchNavigation('pl', { token })

      expect(result).toBeNull()
      expect(captureError).toHaveBeenCalledTimes(1)
      const [error, context] = captureError.mock.calls[0] as [Error, object]
      expect(context).toEqual({
        source: 'payload',
        global: 'navigation',
        draft: true,
      })
      expect(error.cause).toBeUndefined()
      expect(
        JSON.stringify([error.message, error.stack, { ...error }, context]),
      ).not.toContain(token)
    })

    it('treats a draft that does not match the schema as missing, without reporting it', async () => {
      fetchMock.mockResolvedValue({ primaryNav: [{ label: null, url: '/' }] })

      const result = await cmsRepository().fetchNavigation('pl', { token })

      expect(result).toBeNull()
      expect(captureError).not.toHaveBeenCalled()
    })
  })
})
