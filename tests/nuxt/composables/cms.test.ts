import { defineComponent, h } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { useNuxtApp, useState } from 'nuxt/app'

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
import { cmsRepository } from '~/repository/cms.repository'
import { useCmsService } from '~/services/cms.service'
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

vi.mock('~/repository/cms.repository', () => ({
  cmsRepository: vi.fn(),
}))
vi.mock('~/services/cms.service', () => ({
  useCmsService: vi.fn(),
}))

describe('CMS composables in Nuxt', () => {
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
  const getResolvedCategoryTiles = vi.fn<
    (locale: string, medusaLocale?: string) => Promise<CmsCategoryTiles | null>
  >()
  const getResolvedShopTheLook = vi.fn<
    (
      locale: string,
      query?: unknown,
      medusaLocale?: string,
    ) => Promise<ResolvedShopTheLook | null>
  >()

  beforeEach(() => {
    vi.clearAllMocks()
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

  const mountComposable = (
    composable: () => { data: { value: unknown } },
    withCountry = false,
  ) => {
    const Harness = defineComponent({
      setup() {
        const { $i18n } = useNuxtApp()
        $i18n.locale.value = 'pl'
        if (withCountry) {
          useState('country').value = { iso_2: 'pl', region_id: 'reg_pl' }
        }
        const { data } = composable()

        return () =>
          h(
            'output',
            data.value === undefined
              ? 'loading'
              : data.value === null
                ? 'empty'
                : 'loaded',
          )
      },
    })

    return mountSuspended(Harness)
  }

  it('uses Nuxt i18n and async-data context to load navigation', async () => {
    fetchNavigation.mockResolvedValue({ primaryNav: [] })

    const wrapper = await mountComposable(useFetchNavigation)

    await vi.waitFor(() => expect(wrapper.text()).toBe('loaded'))
    expect(fetchNavigation).toHaveBeenCalledWith('pl')
  })

  it('loads footer content through the repository', async () => {
    fetchFooterContent.mockResolvedValue(null)

    const wrapper = await mountComposable(useFetchFooterContent)

    await vi.waitFor(() => expect(wrapper.text()).toBe('empty'))
    expect(fetchFooterContent).toHaveBeenCalledWith('pl')
  })

  it('loads the studio story through the repository', async () => {
    fetchStudioStory.mockResolvedValue(null)

    const wrapper = await mountComposable(useFetchStudioStory)

    await vi.waitFor(() => expect(wrapper.text()).toBe('empty'))
    expect(fetchStudioStory).toHaveBeenCalledWith('pl')
  })

  it('loads brands through the repository', async () => {
    fetchBrands.mockResolvedValue(null)

    const wrapper = await mountComposable(useFetchBrands)

    await vi.waitFor(() => expect(wrapper.text()).toBe('empty'))
    expect(fetchBrands).toHaveBeenCalledWith('pl')
  })

  it('loads the journal section through the repository', async () => {
    fetchJournalSection.mockResolvedValue(null)

    const wrapper = await mountComposable(useFetchJournalSection)

    await vi.waitFor(() => expect(wrapper.text()).toBe('empty'))
    expect(fetchJournalSection).toHaveBeenCalledWith('pl')
  })

  it('loads campaign slides through the repository', async () => {
    fetchCampaignSlides.mockResolvedValue(null)

    const wrapper = await mountComposable(useFetchCampaignSlides)

    await vi.waitFor(() => expect(wrapper.text()).toBe('empty'))
    expect(fetchCampaignSlides).toHaveBeenCalledWith('pl')
  })

  it('resolves category tiles through the CMS service', async () => {
    getResolvedCategoryTiles.mockResolvedValue(null)

    const wrapper = await mountComposable(useFetchCategoryTiles)

    await vi.waitFor(() => expect(wrapper.text()).toBe('empty'))
    expect(getResolvedCategoryTiles).toHaveBeenCalledWith('pl', 'pl-PL')
  })

  it('passes the current locale and country region to the CMS service', async () => {
    getResolvedShopTheLook.mockResolvedValue(null)

    const wrapper = await mountComposable(useFetchShopTheLook, true)

    await vi.waitFor(() => expect(wrapper.text()).toBe('empty'))
    expect(getResolvedShopTheLook).toHaveBeenCalledWith(
      'pl',
      { region_id: 'reg_pl' },
      'pl-PL',
    )
  })
})
