import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { cmsRepository } from '~/repository/cms.repository'
import { useCmsService } from '~/services/cms.service'
import {
  useFetchBrands,
  useFetchCampaignSlides,
  useFetchCategoryTiles,
  useFetchFooterContent,
  useFetchJournalSection,
  useFetchNavigation,
  useFetchShopTheLook,
  useFetchStudioStory,
} from '~/composables/cms'
import type {
  CmsBrands,
  CmsCampaignSlides,
  CmsCategoryTiles,
  CmsFooterContent,
  CmsJournalSection,
  CmsNavigation,
  CmsShopTheLook,
  CmsStudioStory,
  ResolvedShopTheLook,
} from '~/types/cms'
import { toMedusaLocale } from '~/utils/locale'

vi.mock('~/repository/cms.repository', () => ({
  cmsRepository: vi.fn(),
}))
vi.mock('~/services/cms.service', () => ({
  useCmsService: vi.fn(),
}))

describe('cms composables', () => {
  const fetchNavigation =
    vi.fn<(locale: string) => Promise<CmsNavigation | null>>()
  const fetchFooterContent =
    vi.fn<(locale: string) => Promise<CmsFooterContent | null>>()
  const fetchStudioStory =
    vi.fn<(locale: string) => Promise<CmsStudioStory | null>>()
  const fetchBrands = vi.fn<(locale: string) => Promise<CmsBrands | null>>()
  const fetchJournalSection =
    vi.fn<(locale: string) => Promise<CmsJournalSection | null>>()
  const fetchCampaignSlides =
    vi.fn<(locale: string) => Promise<CmsCampaignSlides | null>>()
  const fetchCategoryTiles =
    vi.fn<(locale: string) => Promise<CmsCategoryTiles | null>>()
  const fetchShopTheLook =
    vi.fn<(locale: string) => Promise<CmsShopTheLook | null>>()
  const getResolvedCategoryTiles =
    vi.fn<
      (
        locale: string,
        medusaLocale?: string,
      ) => Promise<CmsCategoryTiles | null>
    >()
  const getResolvedShopTheLook =
    vi.fn<
      (
        locale: string,
        query?: unknown,
        medusaLocale?: string,
      ) => Promise<ResolvedShopTheLook | null>
    >()
  const useLazyAsyncData = vi.fn(
    (key: string, handler: () => Promise<unknown>) => ({ key, handler }),
  )
  const locale = ref('pl')
  const country = ref<{ region_id?: string }>({ region_id: 'reg_pl' })

  Object.assign(globalThis, {
    useI18n: () => ({ locale }),
    useLazyAsyncData,
    useCountry: () => ({ country }),
    toMedusaLocale,
  })

  beforeEach(() => {
    vi.clearAllMocks()
    locale.value = 'pl'
    country.value = { region_id: 'reg_pl' }
    vi.mocked(cmsRepository).mockReturnValue({
      fetchNavigation,
      fetchFooterContent,
      fetchStudioStory,
      fetchBrands,
      fetchJournalSection,
      fetchCampaignSlides,
      fetchCategoryTiles,
      fetchShopTheLook,
    })
    vi.mocked(useCmsService).mockReturnValue({
      getResolvedCategoryTiles,
      getResolvedShopTheLook,
    })
  })

  it('keys the navigation fetch by locale and delegates to the repository', async () => {
    fetchNavigation.mockResolvedValue({ primaryNav: [] })

    useFetchNavigation()

    expect(useLazyAsyncData).toHaveBeenCalledWith(
      'cms:navigation:pl',
      expect.any(Function),
    )

    const handler = useLazyAsyncData.mock.calls[0]![1]
    await handler()
    expect(fetchNavigation).toHaveBeenCalledWith('pl')
  })

  it('keys the footer content fetch by locale and delegates to the repository', async () => {
    fetchFooterContent.mockResolvedValue({
      helpLinks: [],
      worldLinks: [],
      legalLinks: [],
      contact: { email: '', phone: '', hours: '' },
      social: { handle: '' },
    })

    useFetchFooterContent()

    expect(useLazyAsyncData).toHaveBeenCalledWith(
      'cms:footer:pl',
      expect.any(Function),
    )

    const handler = useLazyAsyncData.mock.calls[0]![1]
    await handler()
    expect(fetchFooterContent).toHaveBeenCalledWith('pl')
  })

  it('keys the studio story fetch by locale and delegates to the repository', async () => {
    fetchStudioStory.mockResolvedValue(null)

    useFetchStudioStory()

    expect(useLazyAsyncData).toHaveBeenCalledWith(
      'cms:studio-story:pl',
      expect.any(Function),
    )

    const handler = useLazyAsyncData.mock.calls[0]![1]
    await handler()
    expect(fetchStudioStory).toHaveBeenCalledWith('pl')
  })

  it('keys the brands fetch by locale and delegates to the repository', async () => {
    fetchBrands.mockResolvedValue(null)

    useFetchBrands()

    expect(useLazyAsyncData).toHaveBeenCalledWith(
      'cms:brands:pl',
      expect.any(Function),
    )

    const handler = useLazyAsyncData.mock.calls[0]![1]
    await handler()
    expect(fetchBrands).toHaveBeenCalledWith('pl')
  })

  it('keys the journal section fetch by locale and delegates to the repository', async () => {
    fetchJournalSection.mockResolvedValue(null)

    useFetchJournalSection()

    expect(useLazyAsyncData).toHaveBeenCalledWith(
      'cms:journal-section:pl',
      expect.any(Function),
    )

    const handler = useLazyAsyncData.mock.calls[0]![1]
    await handler()
    expect(fetchJournalSection).toHaveBeenCalledWith('pl')
  })

  it('keys the campaign slides fetch by locale and delegates to the repository', async () => {
    fetchCampaignSlides.mockResolvedValue(null)

    useFetchCampaignSlides()

    expect(useLazyAsyncData).toHaveBeenCalledWith(
      'cms:campaign-slides:pl',
      expect.any(Function),
    )

    const handler = useLazyAsyncData.mock.calls[0]![1]
    await handler()
    expect(fetchCampaignSlides).toHaveBeenCalledWith('pl')
  })

  it('keys the category tiles fetch by locale and delegates to the cms service', async () => {
    getResolvedCategoryTiles.mockResolvedValue(null)

    useFetchCategoryTiles()

    expect(useLazyAsyncData).toHaveBeenCalledWith(
      'cms:category-tiles:pl',
      expect.any(Function),
    )

    const handler = useLazyAsyncData.mock.calls[0]![1]
    await handler()
    expect(getResolvedCategoryTiles).toHaveBeenCalledWith('pl', 'pl-PL')
  })

  it('keys the shop-the-look fetch by locale and region and delegates to the cms service', async () => {
    getResolvedShopTheLook.mockResolvedValue(null)

    useFetchShopTheLook()

    expect(useLazyAsyncData).toHaveBeenCalledWith(
      'cms:shop-the-look:pl:region:reg_pl',
      expect.any(Function),
    )

    const handler = useLazyAsyncData.mock.calls[0]![1]
    await handler()
    expect(getResolvedShopTheLook).toHaveBeenCalledWith(
      'pl',
      { region_id: 'reg_pl' },
      'pl-PL',
    )
  })
})
