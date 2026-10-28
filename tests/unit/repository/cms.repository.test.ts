import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { ZodError } from 'zod'

import { cmsRepository } from '~/repository/cms.repository'
import type { CmsGlobalSlug } from '~/types/cms'
import { payloadGlobals, payloadImage } from '~~/tests/fixtures/cms'

type Repository = ReturnType<typeof cmsRepository>

describe('cms repository', () => {
  const fetchMock = jest.fn<(...args: unknown[]) => Promise<unknown>>()
  const captureError = jest.fn()
  const config = { public: { payloadUrl: 'https://cms.example.com' } }

  Object.assign(globalThis, {
    $fetch: fetchMock,
    useRuntimeConfig: () => config,
    captureError,
  })

  beforeEach(() => {
    jest.clearAllMocks()
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

  it('reports and swallows a Payload failure instead of breaking the page', async () => {
    const error = new Error('fetch failed')
    fetchMock.mockRejectedValue(error)

    const result = await cmsRepository().fetchNavigation('pl')

    expect(result).toBeNull()
    expect(captureError).toHaveBeenCalledWith(error, {
      source: 'payload',
      global: 'navigation',
    })
  })

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
    expect(captureError).toHaveBeenCalledWith(expect.any(ZodError), {
      source: 'payload',
      global: 'navigation',
      type: 'invalid_response',
    })
  })

  it('rejects an image fetched without depth (a bare Media id)', async () => {
    fetchMock.mockResolvedValue({
      ...payloadGlobals['studio-story'],
      image: payloadImage.id,
    })

    const result = await cmsRepository().fetchStudioStory('pl')

    expect(result).toBeNull()
    expect(captureError).toHaveBeenCalledWith(
      expect.any(ZodError),
      expect.objectContaining({ global: 'studio-story' }),
    )
  })

  it('returns null without calling Payload when no URL is configured', async () => {
    config.public.payloadUrl = ''

    const result = await cmsRepository().fetchFooterContent('en')

    expect(result).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
