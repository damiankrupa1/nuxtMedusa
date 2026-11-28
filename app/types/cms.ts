import type { StoreProduct } from '@medusajs/types'
import { z } from '~/utils/zod'

// Payload globals the storefront reads. cms.repository.ts only accepts these,
// and the server/api/cms proxy only forwards these, so a new fetcher can't be
// added without allow-listing its global.
// The copy of the footer's information pages, one global per page (#121): ten
// help and "Świat Fashion" pages and four legal pages. INFO_PAGES
// (app/utils/info-pages.ts) maps each route to its slug.
export const CMS_INFO_PAGE_SLUGS = [
  'info-shipping',
  'info-returns',
  'info-size-guide',
  'info-track-order',
  'info-faq',
  'info-about',
  'info-studio',
  'info-journal',
  'info-materials',
  'info-careers',
  'info-terms',
  'info-privacy',
  'info-cookies',
  'info-accessibility',
] as const

export type CmsInfoPageSlug = (typeof CMS_INFO_PAGE_SLUGS)[number]

export const CMS_GLOBAL_SLUGS = [
  'navigation',
  'footer-content',
  'studio-story',
  'brands',
  'journal-section',
  'campaign-slides',
  'category-tiles',
  'shop-the-look',
  ...CMS_INFO_PAGE_SLUGS,
] as const

export const cmsGlobalSlugSchema = z.enum(CMS_GLOBAL_SLUGS)

export type CmsGlobalSlug = z.infer<typeof cmsGlobalSlugSchema>

// Deepest relationship level the storefront reads (images are depth 1), so
// the proxy can't be used to ask Payload for arbitrarily deep, costly trees.
export const CMS_GLOBAL_MAX_DEPTH = 2

// Query the server/api/cms proxy forwards to Payload. The locale ends up in
// the upstream URL, so it must be a plain language tag; a missing depth is 0,
// like cms.repository.ts's default.
export const cmsGlobalQuerySchema = z.object({
  locale: z
    .string()
    .regex(/^[a-z]{2}(-[A-Za-z]{2})?$/, 'Expected a language tag like "pl"'),
  depth: z.coerce.number().int().min(0).max(CMS_GLOBAL_MAX_DEPTH).default(0),
})

export type CmsGlobalQuery = z.infer<typeof cmsGlobalQuerySchema>

// Shapes of the Payload globals (the contract is in the payload-backend-todo
// skill). cms.repository.ts parses every response with these, so a renamed,
// missing or null field drops that global (reported, rendered as no section)
// instead of reaching a component as `undefined`. Every field is required
// unless it says otherwise; unknown fields (Payload's id, globalType,
// timestamps, array row ids) are stripped.

// Optional text: Payload answers null (or '') for a field left empty
const optionalCmsText = z
  .string()
  .nullish()
  .transform((text) => text || null)

export const cmsNavLinkSchema = z.object({
  label: z.string(),
  url: z.string(),
})

export type CmsNavLink = z.infer<typeof cmsNavLinkSchema>

export const cmsNavigationSchema = z.object({
  primaryNav: z.array(cmsNavLinkSchema),
})

export type CmsNavigation = z.infer<typeof cmsNavigationSchema>

// Contact details and the social handle are optional: the footer's links
// still render while they haven't been entered, and a group with nothing
// in it is `null`, so the footer leaves out the whole block.
export const cmsFooterContactSchema = z.object({
  email: optionalCmsText,
  phone: optionalCmsText,
  hours: optionalCmsText,
})

export type CmsFooterContact = z.infer<typeof cmsFooterContactSchema>

export const cmsFooterSocialSchema = z.object({
  handle: optionalCmsText,
})

export type CmsFooterSocial = z.infer<typeof cmsFooterSocialSchema>

const emptyGroupToNull = <Group extends Record<string, string | null>>(
  group: Group | null | undefined,
): Group | null => (group && Object.values(group).some(Boolean) ? group : null)

export const cmsFooterContentSchema = z.object({
  helpLinks: z.array(cmsNavLinkSchema),
  worldLinks: z.array(cmsNavLinkSchema),
  legalLinks: z.array(cmsNavLinkSchema),
  contact: cmsFooterContactSchema.nullish().transform(emptyGroupToNull),
  social: cmsFooterSocialSchema.nullish().transform(emptyGroupToNull),
})

export type CmsFooterContent = z.infer<typeof cmsFooterContentSchema>

// An upload relationship fetched with depth >= 1 (a bare Media id at depth 0
// is rejected). The alt text is optional on Payload's Media, so a missing one
// is '' (a decorative image) rather than a dropped section.
export const cmsImageSchema = z.object({
  url: z.string().min(1),
  alt: z
    .string()
    .nullish()
    .transform((alt) => alt ?? ''),
})

export type CmsImage = z.infer<typeof cmsImageSchema>

export const cmsBrandsSchema = z.object({
  eyebrow: z.string(),
  viewAllLabel: z.string(),
  viewAllUrl: z.string(),
  otherBrands: z.array(z.string()),
})

export type CmsBrands = z.infer<typeof cmsBrandsSchema>

export const cmsCampaignSlideSchema = z.object({
  seasonLabel: z.string(),
  editionLabel: z.string(),
  headlineLine1: z.string(),
  headlineLine2: z.string(),
  description: z.string(),
  shopCtaLabel: z.string(),
  secondaryCtaLabel: z.string(),
  tagline: z.string(),
  captionEyebrow: z.string(),
  captionHeadline: z.string(),
  image: cmsImageSchema,
})

export type CmsCampaignSlide = z.infer<typeof cmsCampaignSlideSchema>

export const cmsCampaignSlidesSchema = z.object({
  slides: z.array(cmsCampaignSlideSchema),
})

export type CmsCampaignSlides = z.infer<typeof cmsCampaignSlidesSchema>

export const cmsJournalArticleSchema = z.object({
  category: z.string(),
  readingTime: z.string(),
  title: z.string(),
  summary: z.string(),
  image: cmsImageSchema,
  url: z.string(),
})

export type CmsJournalArticle = z.infer<typeof cmsJournalArticleSchema>

export const cmsJournalSectionSchema = z.object({
  eyebrow: z.string(),
  heading: z.string(),
  viewAllLabel: z.string(),
  viewAllUrl: z.string(),
  articles: z.array(cmsJournalArticleSchema),
})

export type CmsJournalSection = z.infer<typeof cmsJournalSectionSchema>

export const cmsStudioStorySchema = z.object({
  eyebrow: z.string(),
  headlineLine1: z.string(),
  headlineLine2: z.string(),
  paragraph1: z.string(),
  paragraph2: z.string(),
  values: z.array(z.string()),
  signatureLabel: z.string(),
  signatureTagline: z.string(),
  collectionLinkLabel: z.string(),
  collectionUrl: z.string(),
  image: cmsImageSchema,
})

export type CmsStudioStory = z.infer<typeof cmsStudioStorySchema>

// Card copy/image are editorial; categoryHandle is the only link to Medusa
// and is validated by app/services/cms.service.ts before this card is shown.
export const cmsCategoryTileSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  categoryHandle: z.string(),
  image: cmsImageSchema,
})

export type CmsCategoryTile = z.infer<typeof cmsCategoryTileSchema>

export const cmsCategoryTilesSchema = z.object({
  eyebrow: z.string(),
  heading: z.string(),
  description: z.string(),
  cards: z.array(cmsCategoryTileSchema),
})

export type CmsCategoryTiles = z.infer<typeof cmsCategoryTilesSchema>

// Editorial copy/image for the "shop the look" section; productHandles is
// the only link to Medusa and is resolved (and validated) by
// app/services/cms.service.ts, which attaches the matching StoreProduct to
// each handle before this is shown.
export const cmsShopTheLookSchema = z.object({
  eyebrow: z.string(),
  headlineLine1: z.string(),
  headlineLine2: z.string(),
  description: z.string(),
  captionLabel: z.string(),
  bottomTagline: z.string(),
  shopSetCtaLabel: z.string(),
  totalLabel: z.string(),
  sizeHint: z.string(),
  productHandles: z.array(z.string()),
  image: cmsImageSchema,
})

export type CmsShopTheLook = z.infer<typeof cmsShopTheLookSchema>

// An information page (#121). One schema for all fourteen globals: they come
// from one factory in Payload. `blockType` is the block's kind; `sizeTable`,
// `contact` and `journal` carry no fields, the storefront fills them from the
// product page's table, the footer global and the journal global.
//
// Payload answers `{}` before the first publication and after "Unpublish"
// (the four legal pages are empty on purpose until the owner writes them):
// that is "no copy", so it parses to `null` without being reported, like a
// missing global. Anything else that doesn't match is a contract change.
//
// The anchor becomes an element id and a `#fragment`, and a link's target is
// rendered as a store link, so both are restricted to what the contract says
// (Payload validates the same on its side).
const cmsInfoBlockSchema = z.discriminatedUnion('blockType', [
  z.object({ blockType: z.literal('text'), text: z.string() }),
  // A fact only the owner knows, shown in neutral wording
  z.object({ blockType: z.literal('placeholder'), text: z.string() }),
  z.object({
    blockType: z.literal('list'),
    ordered: z
      .boolean()
      .nullish()
      .transform((ordered) => ordered ?? false),
    items: z.array(z.object({ text: z.string() })),
  }),
  z.object({
    blockType: z.literal('link'),
    label: z.string(),
    // A path inside the store, relative to the country
    to: z.string().regex(/^\/(?!\/)\S*$/, 'Expected a path inside the store'),
  }),
  z.object({
    blockType: z.literal('faq'),
    items: z.array(z.object({ question: z.string(), answer: z.string() })),
  }),
  z.object({ blockType: z.literal('sizeTable') }),
  z.object({ blockType: z.literal('contact') }),
  z.object({ blockType: z.literal('journal') }),
])

export type CmsInfoBlock = z.infer<typeof cmsInfoBlockSchema>

const cmsInfoSectionSchema = z.object({
  anchor: z.string().regex(/^[A-Za-z][\w-]*$/, 'Expected a plain anchor'),
  heading: z.string(),
  blocks: z.array(cmsInfoBlockSchema),
})

export type CmsInfoSection = z.infer<typeof cmsInfoSectionSchema>

const cmsInfoPageContentSchema = z.object({
  title: z.string(),
  description: z.string(),
  eyebrow: z.string(),
  heading: z.string(),
  lead: z.string(),
  sections: z
    .array(cmsInfoSectionSchema)
    .refine(
      (sections) =>
        new Set(sections.map(({ anchor }) => anchor)).size === sections.length,
      'Section anchors must be unique',
    ),
})

export type CmsInfoPage = z.infer<typeof cmsInfoPageContentSchema>

export const cmsInfoPageSchema = z.union([
  // No copy yet: Payload's `{}`
  z.object({ title: z.undefined().optional() }).transform((): null => null),
  cmsInfoPageContentSchema,
])

export interface ResolvedShopTheLook extends CmsShopTheLook {
  products: StoreProduct[]
}
