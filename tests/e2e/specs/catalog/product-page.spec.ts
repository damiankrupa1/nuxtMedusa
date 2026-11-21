import { expect, test } from '~~/tests/e2e/support/fixtures'
import { trackPageErrors } from '~~/tests/e2e/support/page-errors'
import { priceText, testData } from '~~/tests/e2e/support/test-data'
import type { Page } from '@playwright/test'

// The product page against the e2e seed: variant selection, the price in the
// region's currency, a sold-out product and the Product JSON-LD, all for
// products that have no image (the seed has none on purpose).
const { primary, secondary } = testData.countries
const { coat, soldOut } = testData.products

// i18n/locales/pl.json and en.json: product.variantSelector.*,
// product.availability.inStock, product.price.from, product.optionSelector.select
const copy = {
  pl: {
    selectVariant: 'Wybierz wariant',
    addToCart: 'Dodaj do koszyka',
    inStock: 'Dostępny · wysyłka w 1–2 dni robocze',
    from: 'Od',
    sizeGroup: 'Wybierz Size',
  },
  en: { from: 'From' },
}

const productPath = (country: string, handle: string) =>
  `/${country}/products/${handle}`

// "Od 899,00 zł": the cheapest price, shown while no variant is selected
const fromPrice = (from: string, price: RegExp) =>
  new RegExp(`${from}\\s*${price.source}`)

interface ProductJsonLd {
  name: string
  image?: unknown
  offers: { price: number; priceCurrency: string; availability: string }[]
}

async function readProductJsonLd(page: Page): Promise<ProductJsonLd> {
  const scripts = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents()
  const product = scripts
    .map((text) => JSON.parse(text) as { '@type'?: string })
    .find((data) => data['@type'] === 'Product')
  expect(product, 'Product JSON-LD in the page').toBeDefined()
  return product as unknown as ProductJsonLd
}

test.describe('product page', { tag: '@medusa' }, () => {
  test('picking a color and a size selects the variant, priced in PLN', async ({
    page,
    gotoHydrated,
  }) => {
    const { errors } = trackPageErrors(page)

    await gotoHydrated(productPath(primary, coat.handle))

    const main = page.getByRole('main')
    await expect(
      main.getByRole('heading', { level: 1, name: coat.title }),
    ).toBeVisible()
    // No variant yet: the cheapest price, "from"
    const price = priceText(coat.prices.pln, primary)
    await expect(main).toContainText(fromPrice(copy.pl.from, price))
    const addToCart = main.getByRole('button', { name: copy.pl.selectVariant })
    await expect(addToCart).toBeDisabled()

    const color = coat.colors[1]!
    await main.getByRole('button', { name: color, exact: true }).click()
    await expect(
      main.getByRole('button', { name: color, exact: true }),
    ).toHaveAttribute('aria-pressed', 'true')
    const sizes = main.getByRole('group', { name: copy.pl.sizeGroup })
    await sizes.getByRole('button', { name: 'M', exact: true }).click()

    await expect(
      main.getByRole('button', { name: copy.pl.addToCart }),
    ).toBeEnabled()
    await expect(main.getByRole('status')).toHaveText(copy.pl.inStock)
    // A variant is selected: its own price, without "from"
    await expect(main).toContainText(price)
    await expect(main).not.toContainText(fromPrice(copy.pl.from, price))

    // No image anywhere in the product (the seed has none)
    await expect(main.locator('img')).toHaveCount(0)
    expect(errors()).toEqual([])
  })

  test('shows the price in the currency of the region in the URL', async ({
    page,
    gotoHydrated,
  }) => {
    await gotoHydrated(productPath(secondary, coat.handle))

    await expect(page.getByRole('main')).toContainText(
      fromPrice(copy.en.from, priceText(coat.prices.eur, secondary)),
    )
  })

  test('a sold-out product offers no size and cannot be added to the cart', async ({
    page,
    gotoHydrated,
  }) => {
    const { errors } = trackPageErrors(page)

    await gotoHydrated(productPath(primary, soldOut.handle))

    const main = page.getByRole('main')
    await expect(
      main.getByRole('heading', { level: 1, name: soldOut.title }),
    ).toBeVisible()
    const sizes = main.getByRole('group', { name: copy.pl.sizeGroup })
    await Promise.all(
      soldOut.sizes.map((size) =>
        expect(
          sizes.getByRole('button', { name: size, exact: true }),
        ).toBeDisabled(),
      ),
    )
    await expect(
      main.getByRole('button', { name: copy.pl.selectVariant }),
    ).toBeDisabled()
    expect(errors()).toEqual([])
  })

  test('describes every variant in the JSON-LD, without an image', async ({
    page,
  }) => {
    await page.goto(productPath(primary, coat.handle))
    const coatJsonLd = await readProductJsonLd(page)

    expect(coatJsonLd.name).toBe(coat.title)
    expect(coatJsonLd.image).toBeUndefined()
    expect(coatJsonLd.offers).toHaveLength(
      coat.sizes.length * coat.colors.length,
    )
    coatJsonLd.offers.forEach((offer) =>
      expect(offer).toMatchObject({
        price: coat.prices.pln,
        priceCurrency: 'PLN',
        availability: 'https://schema.org/InStock',
      }),
    )

    await page.goto(productPath(primary, soldOut.handle))
    const soldOutJsonLd = await readProductJsonLd(page)

    expect(soldOutJsonLd.offers).toHaveLength(soldOut.sizes.length)
    soldOutJsonLd.offers.forEach((offer) =>
      expect(offer.availability).toBe('https://schema.org/OutOfStock'),
    )
  })
})
