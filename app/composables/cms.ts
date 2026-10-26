import type {
  CmsBrands,
  CmsCampaignSlides,
  CmsCategoryTiles,
  CmsFooterContent,
  CmsJournalSection,
  CmsNavigation,
  CmsStudioStory,
} from '~/types/cms'
import { cmsRepository } from '~/repository/cms.repository'
import { useCmsService } from '~/services/cms.service'
import type { ResolvedShopTheLook } from '~/services/cms.service'

export const useFetchNavigation = () => {
  const { locale } = useI18n()
  const { fetchNavigation } = cmsRepository()

  return useLazyAsyncData<CmsNavigation | null>(
    `cms:navigation:${locale.value}`,
    async () => await fetchNavigation(locale.value),
  )
}

export const useFetchFooterContent = () => {
  const { locale } = useI18n()
  const { fetchFooterContent } = cmsRepository()

  return useLazyAsyncData<CmsFooterContent | null>(
    `cms:footer:${locale.value}`,
    async () => await fetchFooterContent(locale.value),
  )
}

export const useFetchStudioStory = () => {
  const { locale } = useI18n()
  const { fetchStudioStory } = cmsRepository()

  return useLazyAsyncData<CmsStudioStory | null>(
    `cms:studio-story:${locale.value}`,
    async () => await fetchStudioStory(locale.value),
  )
}

export const useFetchBrands = () => {
  const { locale } = useI18n()
  const { fetchBrands } = cmsRepository()

  return useLazyAsyncData<CmsBrands | null>(
    `cms:brands:${locale.value}`,
    async () => await fetchBrands(locale.value),
  )
}

export const useFetchJournalSection = () => {
  const { locale } = useI18n()
  const { fetchJournalSection } = cmsRepository()

  return useLazyAsyncData<CmsJournalSection | null>(
    `cms:journal-section:${locale.value}`,
    async () => await fetchJournalSection(locale.value),
  )
}

export const useFetchCampaignSlides = () => {
  const { locale } = useI18n()
  const { fetchCampaignSlides } = cmsRepository()

  return useLazyAsyncData<CmsCampaignSlides | null>(
    `cms:campaign-slides:${locale.value}`,
    async () => await fetchCampaignSlides(locale.value),
  )
}

export const useFetchCategoryTiles = () => {
  const { locale } = useI18n()
  const medusaLocale = toMedusaLocale(locale.value)
  const { getResolvedCategoryTiles } = useCmsService()

  return useLazyAsyncData<CmsCategoryTiles | null>(
    `cms:category-tiles:${locale.value}`,
    async () => await getResolvedCategoryTiles(locale.value, medusaLocale),
  )
}

export const useFetchShopTheLook = () => {
  const { locale } = useI18n()
  const { country } = useCountry()
  const medusaLocale = toMedusaLocale(locale.value)
  const { getResolvedShopTheLook } = useCmsService()

  return useLazyAsyncData<ResolvedShopTheLook | null>(
    `cms:shop-the-look:${locale.value}:region:${country.value?.region_id}`,
    async () =>
      await getResolvedShopTheLook(
        locale.value,
        { region_id: country.value?.region_id },
        medusaLocale,
      ),
  )
}
