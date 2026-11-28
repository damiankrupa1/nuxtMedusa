import { PREVIEW_QUERY_PARAM } from '~/types/preview'
import type { InfoPageId } from '~/types/info-page'
import {
  collectInfoPageFaqEntries,
  getInfoPage,
  getInfoPageRobots,
  isIndexableInfoPage,
} from '~/utils/info-pages'

// An information page (#107, #121): its copy is a Payload global, its route
// and status are in INFO_PAGES. A page with no published copy (Payload's
// `{}`, an outage, an invalid global) answers 404; there is no fallback text.
//
//   const { content, ready, notFoundWhenMissing } = useInfoPage('faq')
//   await ready
//   notFoundWhenMissing()
// The draft preview is the exception: a page the editor has never published
// still has to open, so a `?preview` request or an active preview never 404s
// on missing published copy.
//
// The head carries the draft gate: a draft is `noindex, follow`, with no
// canonical or hreflang links and no FAQPage JSON-LD; a published page gets
// the canonical/hreflang links of every indexable page and, when it has
// questions, the FAQPage JSON-LD. Nothing here reads cookies, so the pages
// stay CDN-cacheable.
export const useInfoPage = (id: InfoPageId) => {
  const page = getInfoPage(id)
  const indexable = isIndexableInfoPage(page)
  const route = useRoute()
  const { isPreview } = usePreview()

  const asyncData = useFetchInfoPage(page.slug)
  const { data: content, status } = asyncData

  const previewing = computed(
    () => PREVIEW_QUERY_PARAM in route.query || isPreview.value,
  )

  // Like the by-handle pages: the page awaits `ready` (so the server knows the
  // answer before it renders) and then calls `notFoundWhenMissing()` from its
  // own setup, where the watcher belongs to the component.
  const ready = asyncData.then(() => undefined)
  const notFoundWhenMissing = () =>
    useNotFoundWhenMissing(
      computed(() => content.value ?? (previewing.value ? {} : null)),
      status,
      'Page not found',
    )

  useSeoMeta({
    title: () => content.value?.title,
    ogTitle: () => content.value?.title,
    description: () => content.value?.description,
    ogDescription: () => content.value?.description,
    robots: getInfoPageRobots(page),
  })

  useCountrySeoLinks(() => indexable && !!content.value)

  const faqJsonLd = computed(() =>
    indexable && content.value
      ? buildFaqPageJsonLd(collectInfoPageFaqEntries(content.value))
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

  return { page, content, indexable, ready, notFoundWhenMissing }
}
