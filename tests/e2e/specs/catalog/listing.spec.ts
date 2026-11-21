import { expect, test } from '~~/tests/e2e/support/fixtures'
import { trackPageErrors } from '~~/tests/e2e/support/page-errors'
import { priceText, testData } from '~~/tests/e2e/support/test-data'
import type { SeededProduct } from '~~/tests/e2e/support/test-data'
import { payloadGlobals } from '~~/tests/fixtures/cms'
import type { Locator } from '@playwright/test'

// Smoke test of the catalog against the e2e seed. The seed has no product
// images on purpose (medusaDemo docs/e2e.md), so every card must show its
// title and price without a thumbnail, with no broken image and no error in
// the page.
const country = testData.countries.primary
const { coat, shirt, soldOut } = testData.products
// i18n/locales/pl.json: pages.store.title, pages.home.newArrivals.heading
const storeTitle = 'Wszystkie produkty'
const newArrivalsHeading = 'Nowe, ale na długo.'

// A link to the product's page that shows its PLN price and no image
async function expectProductLink(link: Locator, product: SeededProduct) {
  await expect(link).toBeVisible()
  await expect(link).toHaveAttribute(
    'href',
    `/${country}/products/${product.handle}`,
  )
  await expect(link).toContainText(priceText(product.prices.pln, country))
  await expect(link.locator('img')).toHaveCount(0)
}

test.describe('product listings', { tag: '@medusa' }, () => {
  test('the store lists every seeded product with its price, without a thumbnail', async ({
    page,
    gotoHydrated,
  }) => {
    const { errors } = trackPageErrors(page)
    const products = [coat, shirt, soldOut]

    await gotoHydrated(`/${country}/store`)

    await expect(
      page.getByRole('heading', {
        level: 1,
        name: `${storeTitle} (${products.length})`,
      }),
    ).toBeVisible()
    await Promise.all(
      products.map((product) =>
        expectProductLink(
          page.getByRole('main').getByRole('link', { name: product.title }),
          product,
        ),
      ),
    )
    expect(errors()).toEqual([])
  })

  test('the home page shows seeded products in its Medusa-backed sections', async ({
    page,
    gotoHydrated,
  }) => {
    const { errors } = trackPageErrors(page)

    await gotoHydrated(`/${country}`)

    // New arrivals: product cards from Medusa, without thumbnails
    const newArrivals = page.locator('section').filter({
      has: page.getByRole('heading', { name: newArrivalsHeading }),
    })
    await expectProductLink(
      newArrivals.getByRole('link', { name: coat.title }),
      coat,
    )

    // Shop the look: the stub's handles resolved to Medusa products, with
    // their prices and the total of the look
    const shopTheLook = page.locator('section').filter({
      hasText: payloadGlobals['shop-the-look'].headlineLine1,
    })
    await Promise.all(
      [coat, shirt].map((product) =>
        expectProductLink(
          shopTheLook.getByRole('link', { name: product.title }),
          product,
        ),
      ),
    )
    await expect(
      shopTheLook.getByText(
        priceText(coat.prices.pln + shirt.prices.pln, country),
      ),
    ).toBeVisible()

    expect(errors()).toEqual([])
  })
})
