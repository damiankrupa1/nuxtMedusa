import { expect, test } from '~~/tests/e2e/support/fixtures'
import { trackPageErrors } from '~~/tests/e2e/support/page-errors'
import { priceText, testData } from '~~/tests/e2e/support/test-data'

// Adding to the cart creates a Medusa cart whose id lives in the `cart_id`
// cookie (useUserCart), so the cart is still there after a reload and on the
// cart page. Every test runs in its own browser context, so it gets a cart
// of its own.
const country = testData.countries.primary
const { shirt } = testData.products
const size = 'M'

// i18n/locales/pl.json: product.optionSelector.select,
// product.variantSelector.addToCart, cart.table.variant, pages.cart.heading
const copy = {
  sizeGroup: 'Wybierz Size',
  addToCart: 'Dodaj do koszyka',
  variant: (name: string) => `Wariant: ${name}`,
  cartHeading: 'Koszyk',
}

test.describe('add to cart', { tag: '@medusa' }, () => {
  test('keeps the cart across a reload and shows it on the cart page', async ({
    page,
    context,
    gotoHydrated,
  }) => {
    const { errors } = trackPageErrors(page)
    // The header's cart link shows the number of items, "(n)"
    const cartCount = page
      .getByRole('banner')
      .getByRole('link', { name: /^\(\d+\)$/ })

    await gotoHydrated(`/${country}/products/${shirt.handle}`)
    await expect(cartCount).toHaveText('(0)')
    expect(
      (await context.cookies()).find((cookie) => cookie.name === 'cart_id'),
    ).toBeUndefined()

    const main = page.getByRole('main')
    await main
      .getByRole('group', { name: copy.sizeGroup })
      .getByRole('button', { name: size, exact: true })
      .click()
    await main.getByRole('button', { name: copy.addToCart }).click()

    await expect(cartCount).toHaveText('(1)')
    const cartCookie = (await context.cookies()).find(
      (cookie) => cookie.name === 'cart_id',
    )
    expect(cartCookie?.value).toMatch(/^cart_/)

    // The product page is shared by the CDN, so its server render has no
    // cart; the browser fetches it from the cookie after hydration
    await page.reload()
    await expect(cartCount).toHaveText('(1)')

    await gotoHydrated(`/${country}/cart`)
    await expect(
      page.getByRole('heading', { level: 1, name: copy.cartHeading }),
    ).toBeVisible()
    const item = main.getByRole('row').filter({ hasText: shirt.title })
    await expect(item).toBeVisible()
    await expect(item).toContainText(copy.variant(size))
    await expect(item).toContainText(priceText(shirt.prices.pln, country))

    // Still the same cart
    expect(
      (await context.cookies()).find((cookie) => cookie.name === 'cart_id')
        ?.value,
    ).toBe(cartCookie?.value)
    expect(errors()).toEqual([])
  })
})
