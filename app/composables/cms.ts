import type {
  CmsBrands,
  CmsFooterContent,
  CmsNavigation,
  CmsStudioStory,
} from '../types/cms'
import { cmsRepository } from '../repository/cms.repository'

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
