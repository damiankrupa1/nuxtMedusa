import type {
  CmsBrands,
  CmsCampaignSlides,
  CmsCategoryTiles,
  CmsFooterContent,
  CmsInfoPage,
  CmsInfoPageSlug,
  CmsJournalSection,
  CmsNavigation,
  CmsStudioStory,
  ResolvedShopTheLook,
} from '~/types/cms'
import type { CmsPreviewRequest } from '~/types/preview'
import { cmsRepository } from '~/repository/cms.repository'
import { useCmsService } from '~/services/cms.service'

// Every CMS read goes through here so the published content and the draft
// preview (#53) can never share a cache entry. Outside the preview the key is
// the published one and the fetcher gets no preview request. In the preview
// both switch together, to `<key>:preview` and the preview's token, because
// both are read from the same state when the key changes; the published key
// never runs a draft fetch. Nuxt refetches when the key changes, which is how
// a page switches to the drafts once the plugin has started the preview
// after hydration.
const useCmsAsyncData = <T>(
  key: string,
  fetcher: (preview?: CmsPreviewRequest) => Promise<T | null>,
) => {
  const { isPreview, previewToken, expire } = usePreview()

  return useLazyAsyncData<T | null>(
    () => toCmsCacheKey(key, isPreview.value),
    async () => {
      if (!isPreview.value) return await fetcher()

      try {
        return await fetcher({ token: previewToken.value })
      } catch (error) {
        // The token was refused: end the preview with a message rather than
        // fall back to the published version
        if (isPreviewUnauthorizedError(error)) {
          expire()
          return null
        }
        throw error
      }
    },
  )
}

export const useFetchNavigation = () => {
  const { locale } = useI18n()
  const { fetchNavigation } = cmsRepository()

  return useCmsAsyncData<CmsNavigation>(
    `cms:navigation:${locale.value}`,
    async (preview) => await fetchNavigation(locale.value, preview),
  )
}

export const useFetchFooterContent = () => {
  const { locale } = useI18n()
  const { fetchFooterContent } = cmsRepository()

  return useCmsAsyncData<CmsFooterContent>(
    `cms:footer:${locale.value}`,
    async (preview) => await fetchFooterContent(locale.value, preview),
  )
}

export const useFetchStudioStory = () => {
  const { locale } = useI18n()
  const { fetchStudioStory } = cmsRepository()

  return useCmsAsyncData<CmsStudioStory>(
    `cms:studio-story:${locale.value}`,
    async (preview) => await fetchStudioStory(locale.value, preview),
  )
}

export const useFetchBrands = () => {
  const { locale } = useI18n()
  const { fetchBrands } = cmsRepository()

  return useCmsAsyncData<CmsBrands>(
    `cms:brands:${locale.value}`,
    async (preview) => await fetchBrands(locale.value, preview),
  )
}

export const useFetchJournalSection = () => {
  const { locale } = useI18n()
  const { fetchJournalSection } = cmsRepository()

  return useCmsAsyncData<CmsJournalSection>(
    `cms:journal-section:${locale.value}`,
    async (preview) => await fetchJournalSection(locale.value, preview),
  )
}

export const useFetchCampaignSlides = () => {
  const { locale } = useI18n()
  const { fetchCampaignSlides } = cmsRepository()

  return useCmsAsyncData<CmsCampaignSlides>(
    `cms:campaign-slides:${locale.value}`,
    async (preview) => await fetchCampaignSlides(locale.value, preview),
  )
}

export const useFetchInfoPage = (slug: CmsInfoPageSlug) => {
  const { locale } = useI18n()
  const { fetchInfoPage } = cmsRepository()

  return useCmsAsyncData<CmsInfoPage>(
    `cms:${slug}:${locale.value}`,
    async (preview) => await fetchInfoPage(slug, locale.value, preview),
  )
}

export const useFetchCategoryTiles = () => {
  const { locale } = useI18n()
  const medusaLocale = toMedusaLocale(locale.value)
  const { getResolvedCategoryTiles } = useCmsService()

  return useCmsAsyncData<CmsCategoryTiles>(
    `cms:category-tiles:${locale.value}`,
    async (preview) =>
      await getResolvedCategoryTiles(locale.value, medusaLocale, preview),
  )
}

export const useFetchShopTheLook = () => {
  const { locale } = useI18n()
  const { country } = useCountry()
  const medusaLocale = toMedusaLocale(locale.value)
  const { getResolvedShopTheLook } = useCmsService()

  return useCmsAsyncData<ResolvedShopTheLook>(
    `cms:shop-the-look:${locale.value}:region:${country.value?.region_id}`,
    async (preview) =>
      await getResolvedShopTheLook(
        locale.value,
        { region_id: country.value?.region_id },
        medusaLocale,
        preview,
      ),
  )
}
