import type {
  CmsBrands,
  CmsCampaignSlides,
  CmsFooterContent,
  CmsJournalSection,
  CmsNavigation,
  CmsStudioStory,
} from '../types/cms'

// Payload's REST API is public read-only today (see the Navigation/
// FooterContent globals' `access.read`), so this fetches it directly. If that
// ever moves behind a server/api/cms proxy (an API key, draft previews), only
// this function's fetch target changes — callers below don't.
async function fetchGlobal<T>(slug: string, locale: string): Promise<T | null> {
  const {
    public: { payloadUrl },
  } = useRuntimeConfig()
  if (!payloadUrl) return null

  try {
    return await $fetch<T>(`${payloadUrl}/api/globals/${slug}`, {
      query: { locale, depth: 0 },
    })
  } catch (error) {
    // CMS content is non-critical chrome (nav/footer); a Payload outage must
    // not break page rendering, so the error is reported and swallowed here
    // rather than rethrown for the composable to deal with.
    captureError(error, { source: 'payload', global: slug })
    return null
  }
}

export function cmsRepository() {
  return {
    async fetchNavigation(locale: string): Promise<CmsNavigation | null> {
      return fetchGlobal<CmsNavigation>('navigation', locale)
    },
    async fetchFooterContent(locale: string): Promise<CmsFooterContent | null> {
      return fetchGlobal<CmsFooterContent>('footer-content', locale)
    },
    async fetchStudioStory(locale: string): Promise<CmsStudioStory | null> {
      return fetchGlobal<CmsStudioStory>('studio-story', locale)
    },
    async fetchBrands(locale: string): Promise<CmsBrands | null> {
      return fetchGlobal<CmsBrands>('brands', locale)
    },
    async fetchJournalSection(locale: string): Promise<CmsJournalSection | null> {
      return fetchGlobal<CmsJournalSection>('journal-section', locale)
    },
    async fetchCampaignSlides(locale: string): Promise<CmsCampaignSlides | null> {
      return fetchGlobal<CmsCampaignSlides>('campaign-slides', locale)
    },
  }
}
