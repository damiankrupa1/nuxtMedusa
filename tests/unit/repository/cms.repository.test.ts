import { beforeEach, describe, expect, it, jest } from '@jest/globals'

import { cmsRepository } from '../../../app/repository/cms.repository'

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

  it('fetches the navigation global for the given locale', async () => {
    fetchMock.mockResolvedValue({
      primaryNav: [{ label: 'New in', url: '/new' }],
    })

    const result = await cmsRepository().fetchNavigation('pl')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://cms.example.com/api/globals/navigation',
      { query: { locale: 'pl', depth: 0 } },
    )
    expect(result).toEqual({ primaryNav: [{ label: 'New in', url: '/new' }] })
  })

  it('fetches the footer content global for the given locale', async () => {
    fetchMock.mockResolvedValue({ helpLinks: [] })

    await cmsRepository().fetchFooterContent('en')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://cms.example.com/api/globals/footer-content',
      { query: { locale: 'en', depth: 0 } },
    )
  })

  it('fetches the studio story global for the given locale', async () => {
    fetchMock.mockResolvedValue({ eyebrow: 'The Studio' })

    await cmsRepository().fetchStudioStory('pl')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://cms.example.com/api/globals/studio-story',
      { query: { locale: 'pl', depth: 0 } },
    )
  })

  it('fetches the brands global for the given locale', async () => {
    fetchMock.mockResolvedValue({ otherBrands: [] })

    await cmsRepository().fetchBrands('en')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://cms.example.com/api/globals/brands',
      { query: { locale: 'en', depth: 0 } },
    )
  })

  it('fetches the journal section global for the given locale', async () => {
    fetchMock.mockResolvedValue({ articles: [] })

    await cmsRepository().fetchJournalSection('pl')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://cms.example.com/api/globals/journal-section',
      { query: { locale: 'pl', depth: 0 } },
    )
  })

  it('fetches the campaign slides global for the given locale', async () => {
    fetchMock.mockResolvedValue({ slides: [] })

    await cmsRepository().fetchCampaignSlides('pl')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://cms.example.com/api/globals/campaign-slides',
      { query: { locale: 'pl', depth: 0 } },
    )
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

  it('returns null without calling Payload when no URL is configured', async () => {
    config.public.payloadUrl = ''

    const result = await cmsRepository().fetchFooterContent('en')

    expect(result).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
