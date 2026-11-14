import { expect, test } from '~~/tests/e2e/support/fixtures'
import { testData } from '~~/tests/e2e/support/test-data'

// Catalog pages are shared by the CDN (CDN-Cache-Control) and so must carry no
// Set-Cookie; per-visitor pages must never be shared (server/plugins/cdn-cache.ts).
const country = testData.countries.primary

test.describe('CDN cache headers', { tag: '@medusa' }, () => {
  ;[
    `/${country}`,
    `/${country}/store`,
    `/${country}/products/${testData.productHandle}`,
  ].forEach((path) => {
    test(`${path} is shareable`, async ({ request }) => {
      const response = await request.get(path)

      expect(response.status()).toBe(200)
      expect(response.headers()['cdn-cache-control']).toBe(
        'max-age=60, stale-while-revalidate=300',
      )
      expect(response.headers()['set-cookie']).toBeUndefined()
    })
  })
  ;['cart', 'checkout', 'account'].forEach((page) => {
    test(`/${country}/${page} is not shareable`, async ({ request }) => {
      const response = await request.get(`/${country}/${page}`)

      expect(response.headers()['cdn-cache-control']).toBeUndefined()
    })
  })
})
