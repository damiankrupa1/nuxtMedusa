// A <link> in the page head: the canonical URL or a country version of it
export type SeoLink = {
  key: string
  rel: 'canonical' | 'alternate'
  href: string
  hreflang?: string
}

export type CountryLinksInput = {
  // Absolute origin of the site, e.g. https://shop.example.com
  siteUrl: string
  // Current route path, starting with the country code (/pl/products/shorts)
  path: string
  // ?page= of a paginated catalog page; any other query param is dropped
  page?: unknown
  countryCodes: string[]
  // Country whose version is offered as hreflang="x-default"
  defaultCountry: string
}

// A catalog item from Medusa that has its own page
export type SitemapCatalogItem = {
  handle?: string | null
  updated_at?: string | Date | null
}

export type SitemapUrl = {
  loc: string
  lastmod?: string | Date
}

export type CatalogSitemapInput = {
  countryCodes: string[]
  products: SitemapCatalogItem[]
  categories: SitemapCatalogItem[]
  collections: SitemapCatalogItem[]
}

export type SchemaAvailability = 'InStock' | 'OutOfStock' | 'BackOrder'

export type ProductOfferJsonLd = {
  '@type': 'Offer'
  url: string
  price: number
  priceCurrency: string
  availability: `https://schema.org/${SchemaAvailability}`
  sku?: string
  name?: string
}

export type ProductJsonLd = {
  '@context': 'https://schema.org'
  '@type': 'Product'
  name: string
  url: string
  description?: string
  image?: string[]
  offers: ProductOfferJsonLd[]
}
