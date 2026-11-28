import type { InfoPageId } from '~/types/info-page'
import {
  collectInfoPageFaqKeys,
  getInfoPage,
  getInfoPageRobots,
  isIndexableInfoPage,
} from '~/utils/info-pages'

// Head of an information page (#107): title and description from i18n, and
// the draft gate. A draft (INFO_PAGES) is `noindex, follow`, has no canonical
// or hreflang links and no FAQPage JSON-LD; a published page gets the
// canonical/hreflang links of every indexable page and, when it has
// questions, the FAQPage JSON-LD. Nothing here reads cookies, so the pages
// stay CDN-cacheable.
export const useInfoPageSeo = (id: InfoPageId) => {
  const { t } = useI18n()
  const page = getInfoPage(id)
  const indexable = isIndexableInfoPage(page)

  useSeoMeta({
    title: t(`pages.${id}.title`),
    ogTitle: t(`pages.${id}.title`),
    description: t(`pages.${id}.description`),
    ogDescription: t(`pages.${id}.description`),
    robots: getInfoPageRobots(page),
  })

  useCountrySeoLinks(indexable)

  const faqJsonLd = computed(() =>
    indexable
      ? buildFaqPageJsonLd(
          collectInfoPageFaqKeys(page).map((entry) => ({
            question: t(entry.question),
            answer: t(entry.answer),
          })),
        )
      : null,
  )

  useHead({
    script: computed(() =>
      faqJsonLd.value
        ? [
            {
              key: 'faq-jsonld',
              type: 'application/ld+json',
              innerHTML: serializeJsonLd(faqJsonLd.value),
            },
          ]
        : [],
    ),
  })

  return { page, indexable }
}
