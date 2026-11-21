import type { Page } from '@playwright/test'
import { expect, test } from '~~/tests/e2e/support/fixtures'
import { trackPageErrors } from '~~/tests/e2e/support/page-errors'
import { testData } from '~~/tests/e2e/support/test-data'

// The Content-Security-Policy-Report-Only (#90,
// server/utils/content-security-policy.ts) must allow everything the pages
// load from our own app, Medusa and the Payload stub before it is ever
// enforced. The browser fires `securitypolicyviolation` for a report-only
// violation too, so a source the policy is missing fails here (and, as a
// console error, in trackPageErrors of every other spec). The checkout with
// Stripe and the InPost Geowidget is not covered: it needs keys.
const country = testData.countries.primary

type Violation = { directive: string; blocked: string; source: string }
type WindowWithViolations = Window & { cspViolations?: Violation[] }

async function trackViolations(page: Page) {
  await page.addInitScript(() => {
    const target = window as WindowWithViolations
    target.cspViolations = []
    document.addEventListener('securitypolicyviolation', (event) => {
      target.cspViolations?.push({
        directive: event.effectiveDirective,
        blocked: event.blockedURI,
        source: event.sourceFile,
      })
    })
  })
  return () =>
    page.evaluate(() => (window as WindowWithViolations).cspViolations ?? [])
}

test.describe('Content-Security-Policy-Report-Only', { tag: '@medusa' }, () => {
  test('is sent with the other security headers', async ({ request }) => {
    const response = await request.get(`/${country}`)
    const headers = response.headers()

    expect(headers['content-security-policy-report-only']).toContain(
      "default-src 'self'",
    )
    expect(headers['content-security-policy']).toBe("frame-ancestors 'self'")
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(headers['permissions-policy']).toContain('camera=()')
  })
  ;[
    `/${country}`,
    `/${country}/store`,
    `/${country}/products/${testData.productHandle}`,
    `/${country}/categories/${testData.categoryHandle}`,
    `/${country}/collections/${testData.collectionHandle}`,
    `/${country}/search?q=coat`,
    `/${country}/cart`,
    `/${country}/account`,
  ].forEach((path) => {
    test(`${path} causes no violation`, async ({ page, gotoHydrated }) => {
      const violations = await trackViolations(page)
      const pageErrors = trackPageErrors(page)

      await gotoHydrated(path)
      // Images and lazy chunks load after hydration
      await page.mouse.wheel(0, 4000)
      await expect(page.locator('body')).toBeVisible()

      expect(await violations()).toEqual([])
      expect(pageErrors.errors()).toEqual([])
    })
  })

  test('a client-side navigation causes no violation', async ({
    page,
    gotoHydrated,
  }) => {
    const violations = await trackViolations(page)
    const pageErrors = trackPageErrors(page)

    await gotoHydrated(`/${country}/store`)
    await page
      .getByRole('main')
      .getByRole('link', { name: testData.products.coat.title })
      .first()
      .click()
    await expect(page).toHaveURL(/\/products\//)
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: testData.products.coat.title,
      }),
    ).toBeVisible()

    expect(await violations()).toEqual([])
    expect(pageErrors.errors()).toEqual([])
  })
})
