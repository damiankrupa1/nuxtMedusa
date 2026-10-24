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
