// Every page lives under /<countryCode>/. Cart, checkout, account, wishlist
// and order confirmation are per visitor (and noindex), so crawlers skip them.
// `$` and `?` end the match so /pl/products/cartoon-tee stays crawlable (only a
// product/category handle that is exactly "cart", "checkout", "account" or
// "wishlist" would be caught, since `*` also spans slashes).
const PRIVATE_PAGES = ['cart', 'checkout', 'account', 'wishlist']

export function buildRobotsTxt(siteUrl: string): string {
  const sitemapUrl = `${siteUrl.replace(/\/+$/, '')}/sitemap.xml`

  return [
    'User-agent: *',
    ...PRIVATE_PAGES.flatMap((page) => [
      `Disallow: /*/${page}$`,
      `Disallow: /*/${page}?`,
    ]),
    'Disallow: /*/order/',
    '',
    `Sitemap: ${sitemapUrl}`,
    '',
  ].join('\n')
}
