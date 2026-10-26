export interface CmsNavLink {
  label: string
  url: string
}

export interface CmsNavigation {
  primaryNav: CmsNavLink[]
}

export interface CmsFooterContact {
  email: string
  phone: string
  hours: string
}

export interface CmsFooterSocial {
  handle: string
}

export interface CmsFooterContent {
  helpLinks: CmsNavLink[]
  worldLinks: CmsNavLink[]
  legalLinks: CmsNavLink[]
  contact: CmsFooterContact
  social: CmsFooterSocial
}

export interface CmsImage {
  url: string
  alt: string
}

export interface CmsBrands {
  eyebrow: string
  viewAllLabel: string
  viewAllUrl: string
  otherBrands: string[]
}

export interface CmsCampaignSlide {
  seasonLabel: string
  editionLabel: string
  headlineLine1: string
  headlineLine2: string
  description: string
  shopCtaLabel: string
  secondaryCtaLabel: string
  tagline: string
  captionEyebrow: string
  captionHeadline: string
  image: CmsImage
}

export interface CmsCampaignSlides {
  slides: CmsCampaignSlide[]
}

export interface CmsJournalArticle {
  category: string
  readingTime: string
  title: string
  summary: string
  image: CmsImage
  url: string
}

export interface CmsJournalSection {
  eyebrow: string
  heading: string
  viewAllLabel: string
  viewAllUrl: string
  articles: CmsJournalArticle[]
}

export interface CmsStudioStory {
  eyebrow: string
  headlineLine1: string
  headlineLine2: string
  paragraph1: string
  paragraph2: string
  values: string[]
  signatureLabel: string
  signatureTagline: string
  collectionLinkLabel: string
  collectionUrl: string
  image: CmsImage
}

// Card copy/image are editorial; categoryHandle is the only link to Medusa
// and is validated by app/services/cms.service.ts before this card is shown.
export interface CmsCategoryTile {
  title: string
  subtitle: string
  categoryHandle: string
  image: CmsImage
}

export interface CmsCategoryTiles {
  eyebrow: string
  heading: string
  description: string
  cards: CmsCategoryTile[]
}

// Editorial copy/image for the "shop the look" section; productHandles is
// the only link to Medusa and is resolved (and validated) by
// app/services/cms.service.ts, which attaches the matching StoreProduct to
// each handle before this is shown.
export interface CmsShopTheLook {
  eyebrow: string
  headlineLine1: string
  headlineLine2: string
  description: string
  captionLabel: string
  bottomTagline: string
  shopSetCtaLabel: string
  totalLabel: string
  sizeHint: string
  productHandles: string[]
  image: CmsImage
}
