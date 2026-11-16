import { expect, test } from '~~/tests/e2e/support/fixtures'
import { testData } from '~~/tests/e2e/support/test-data'

// A handle Medusa doesn't know answers a real 404 (useNotFoundWhenMissing),
// not an empty page with a 200 that crawlers would index, and that page is
// never shared by the CDN (#66: the rendered error page used to carry
// CDN-Cache-Control because Nuxt renders it as a 200 before applying the 404).
const country = testData.countries.primary

test.describe('unknown catalog handle', { tag: '@medusa' }, () => {
  ;[
    ['product', 'products', testData.unknown.product],
    ['category', 'categories', testData.unknown.category],
    ['collection', 'collections', testData.unknown.collection],
  ].forEach(([kind, segment, handle]) => {
    test(`answers 404 for an unknown ${kind}`, async ({ page }) => {
      const response = await page.goto(`/${country}/${segment}/${handle}`)

      expect(response?.status()).toBe(404)
      expect(response?.headers()['cdn-cache-control']).toBeUndefined()
    })
  })
})
