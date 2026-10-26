// Imported explicitly (not auto-imported): server/api/__sitemap__ uses this
// file as well, and Nitro doesn't auto-import app/utils
import { getLocaleFromCountryCode } from '~/utils/locale'
import type {
  CatalogSitemapInput,
  CountryLinksInput,
  SeoLink,
  SitemapCatalogItem,
  SitemapUrl,
} from '~/types/seo'

// Every page exists once per country, in the language the region middleware
// switches to for that country (getLocaleFromCountryCode): /de is English for
// Germany → en-DE, /pl is Polish for Poland → pl-PL
export function getHreflang(countryCode: string): string {
  return `${getLocaleFromCountryCode(countryCode)}-${countryCode.toUpperCase()}`
}

// Country codes of the regions' countries, as used in the URL
export function toCountryCodes(
  countries?: { iso_2?: string | null }[] | null,
): string[] {
  return (countries ?? [])
    .map((country) => country.iso_2)
    .filter((countryCode): countryCode is string => Boolean(countryCode))
}

// /pl/products/shorts → /products/shorts, /pl → /
export function stripCountryCode(path: string): string {
  const rest = path.split('/').filter(Boolean).slice(1)
  return rest.length ? `/${rest.join('/')}` : '/'
}

// The same page in another country: /products/shorts → /de/products/shorts
export function toCountryPath(countryCode: string, path: string): string {
  return path === '/' ? `/${countryCode}` : `/${countryCode}${path}`
}

// Only the page number tells two catalog URLs apart; sorting and other
// params show the same products, so they share the canonical URL
function toPageQuery(page: unknown): string {
  const value = Array.isArray(page) ? page[0] : page
  const pageNumber = Number(value)
  return Number.isInteger(pageNumber) && pageNumber > 1
    ? `?page=${pageNumber}`
    : ''
}

// Canonical URL of the current page plus one hreflang alternate per country,
// and x-default pointing at the default country's version
export function buildCountryLinks({
  siteUrl,
  path,
  page,
  countryCodes,
  defaultCountry,
}: CountryLinksInput): SeoLink[] {
  const origin = siteUrl.replace(/\/+$/, '')
  const [currentCountry] = path.split('/').filter(Boolean)
  if (!origin || !currentCountry) return []

  const countryPath = stripCountryCode(path)
  const query = toPageQuery(page)
  const urlFor = (countryCode: string) =>
    `${origin}${toCountryPath(countryCode, countryPath)}${query}`

  const links: SeoLink[] = [
    { key: 'canonical', rel: 'canonical', href: urlFor(currentCountry) },
  ]

  const uniqueCountryCodes = [...new Set(countryCodes)]
  for (const countryCode of uniqueCountryCodes) {
    const hreflang = getHreflang(countryCode)
    links.push({
      key: `alternate:${hreflang}`,
      rel: 'alternate',
      hreflang,
      href: urlFor(countryCode),
    })
  }

  if (uniqueCountryCodes.includes(defaultCountry)) {
    links.push({
      key: 'alternate:x-default',
      rel: 'alternate',
      hreflang: 'x-default',
      href: urlFor(defaultCountry),
    })
  }

  return links
}

function toItemUrls(
  countryCode: string,
  prefix: string,
  items: SitemapCatalogItem[],
): SitemapUrl[] {
  return items
    .filter((item): item is SitemapCatalogItem & { handle: string } =>
      Boolean(item.handle),
    )
    .map((item) => ({
      loc: toCountryPath(
        countryCode,
        `${prefix}/${encodeURIComponent(item.handle)}`,
      ),
      ...(item.updated_at ? { lastmod: item.updated_at } : {}),
    }))
}

// The indexable catalog pages of every country: home, store, and one page per
// product, category and collection. Paths are relative; @nuxtjs/sitemap
// prefixes them with the site URL.
export function buildCatalogSitemapUrls({
  countryCodes,
  products,
  categories,
  collections,
}: CatalogSitemapInput): SitemapUrl[] {
  return [...new Set(countryCodes)].flatMap((countryCode) => [
    { loc: toCountryPath(countryCode, '/') },
    { loc: toCountryPath(countryCode, '/store') },
    ...toItemUrls(countryCode, '/products', products),
    ...toItemUrls(countryCode, '/categories', categories),
    ...toItemUrls(countryCode, '/collections', collections),
  ])
}
