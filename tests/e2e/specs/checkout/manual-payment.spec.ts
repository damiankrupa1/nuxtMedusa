import {
  addToCart,
  checkoutCopy,
  chooseDelivery,
  choosePayment,
  expectPlacedOrder,
  fillAddressStep,
  getCartId,
  newGuestCustomer,
  orderTotalPattern,
  placeOrderButton,
  waitForConfirmation,
} from '~~/tests/e2e/support/checkout'
import { expect, test } from '~~/tests/e2e/support/fixtures'
import { storeApi } from '~~/tests/e2e/support/medusa'
import { trackPageErrors } from '~~/tests/e2e/support/page-errors'
import { priceText, testData } from '~~/tests/e2e/support/test-data'

// Guest checkout with the manual payment provider (pp_system_default), so no
// Stripe: address, the "Standard" delivery (manual fulfillment, no InPost
// locker to pick), payment, review, place order, confirmation. Each test
// makes its own cart and its own guest e-mail.
const country = testData.countries.primary
const { shirt } = testData.products
const size = 'M'
const delivery = testData.shippingOptions.standard
const payment = testData.paymentProviders.manual
// The seed's tax regions have no rates, so the total is item + shipping
const total = shirt.prices.pln + delivery.prices.pln

const expected = {
  product: shirt,
  size,
  currency: 'pln',
  total,
  providerId: payment.id,
}

test.describe('guest checkout with manual payment', { tag: '@medusa' }, () => {
  test('places the order and shows its confirmation with number and total', async ({
    page,
    context,
    request,
    gotoHydrated,
  }) => {
    const { errors } = trackPageErrors(page)
    const customer = newGuestCustomer('manual')
    const cartId = await addToCart(page, gotoHydrated, {
      country,
      product: shirt,
      size,
    })

    await gotoHydrated(`/${country}/checkout`)
    await expect(page).toHaveURL(/[?&]step=address\b/)
    await fillAddressStep(page, customer)
    await chooseDelivery(page, delivery.name)
    await choosePayment(page, payment.label)

    const main = page.getByRole('main')
    await expect(
      main.getByRole('heading', { level: 2, name: checkoutCopy.reviewHeading }),
    ).toBeVisible()
    // The summary of the earlier steps
    await expect(main).toContainText(customer.email)
    await expect(main).toContainText(
      new RegExp(
        `${delivery.name}\\s*\\(${priceText(delivery.prices.pln, country).source}\\)`,
      ),
    )
    await expect(main).toContainText(payment.label)

    await expect(placeOrderButton(page)).toBeEnabled()
    await placeOrderButton(page).click()

    const orderId = await waitForConfirmation(page, country)
    await expect(main).toContainText(customer.email)
    await expect(main).toContainText(shirt.title)
    await expect(main).toContainText(
      orderTotalPattern(priceText(total, country)),
    )

    // The storefront forgets the completed cart
    expect(await getCartId(context)).toBeFalsy()

    await expectPlacedOrder(storeApi(request), {
      ...expected,
      orderId,
      cartId,
      email: customer.email,
    })
    expect(errors()).toEqual([])
  })

  test('a double click on "place order" completes the cart once', async ({
    page,
    request,
    gotoHydrated,
  }) => {
    const customer = newGuestCustomer('double-submit')
    const cartId = await addToCart(page, gotoHydrated, {
      country,
      product: shirt,
      size,
    })

    await gotoHydrated(`/${country}/checkout`)
    await expect(page).toHaveURL(/[?&]step=address\b/)
    await fillAddressStep(page, customer)
    await chooseDelivery(page, delivery.name)
    await choosePayment(page, payment.label)

    // Every cart completion the page sends is counted, and the first one is
    // held until the clicks are done, so the second click certainly lands
    // while the first request is still in flight
    const completions: string[] = []
    let releaseFirst!: () => void
    const firstHeld = new Promise<void>((resolve) => {
      releaseFirst = resolve
    })
    await page.route(`**/store/carts/${cartId}/complete`, async (route) => {
      if (route.request().method() === 'POST') {
        completions.push(route.request().url())
        if (completions.length === 1) await firstHeld
      }
      await route.continue()
    })

    const button = placeOrderButton(page)
    await expect(button).toBeEnabled()
    await button.dblclick()
    await expect.poll(() => completions.length).toBe(1)
    // While the order is being placed the button is disabled, and further
    // clicks (forced past Playwright's enabled check, like an impatient
    // shopper) send nothing
    await expect(button).toBeDisabled()
    await button.click({ force: true })
    releaseFirst()

    const orderId = await waitForConfirmation(page, country)
    expect(completions).toHaveLength(1)

    const api = storeApi(request)
    await expectPlacedOrder(api, {
      ...expected,
      orderId,
      cartId,
      email: customer.email,
    })

    // Should a second completion reach Medusa anyway (e.g. a retried
    // request), Medusa answers with the same order instead of a new one
    const again = await api.completeCart(cartId)
    expect(again.type).toBe('order')
    expect(again.type === 'order' ? again.order.id : undefined).toBe(orderId)
  })
})
