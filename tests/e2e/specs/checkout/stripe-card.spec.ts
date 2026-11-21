import type { Locator, Page } from '@playwright/test'
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
import { hasStripe } from '~~/tests/e2e/support/env'
import { expect, test } from '~~/tests/e2e/support/fixtures'
import { storeApi } from '~~/tests/e2e/support/medusa'
import { priceText, testData } from '~~/tests/e2e/support/test-data'

// Guest checkout paid with a Stripe test card (pp_stripe_stripe, Stripe's
// Card Element, confirmCardPayment in the browser, then Medusa authorizes the
// PaymentIntent when the cart is completed). Stripe TEST MODE only: it needs
// E2E_STRIPE_KEY (pk_test_) for the storefront and the same account's
// sk_test_ key in the e2e Medusa (the e2e-medusa action's stripe-secret-key),
// so these specs run in GitHub Actions with the repository's secrets and are
// left out everywhere else. Nothing here depends on Stripe webhooks: the
// order is placed by the storefront right after Stripe.js confirmed the card.
//
// Card numbers: https://docs.stripe.com/testing
const cards = {
  success: '4242424242424242',
  declined: '4000000000000002',
  // Requires 3D Secure 2 authentication on every payment
  threeDSecure: '4000002760003184',
}
// Any future expiry date, any CVC, any postal code
const expiry = '1234'
const cvc = '123'
const postalCode = '42424'

const country = testData.countries.primary
const { shirt } = testData.products
const size = 'M'
const delivery = testData.shippingOptions.standard
const payment = testData.paymentProviders.stripeCard
const total = shirt.prices.pln + delivery.prices.pln

// Stripe.js, its iframes and Stripe's API answer from the internet, and the
// cart completion asks Stripe too, so the waits are longer than elsewhere
const STRIPE_TIMEOUT = 60_000

// Through the guest checkout to the review step with the card payment chosen.
// Continuing from the payment step creates the PaymentIntent in Medusa.
async function goToCardReview(
  page: Page,
  gotoHydrated: (path: string) => Promise<unknown>,
  prefix: string,
) {
  const customer = newGuestCustomer(prefix)
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
  return { customer, cartId }
}

// Types a card into Stripe's Card Element, a single cross-origin iframe that
// useCartPayment() mounts in the review step's card container. Its inputs are
// Stripe's own (cardnumber, exp-date, cvc and, shown for most cards, postal).
// "Place order" is enabled only once the element reports `complete`, which
// the page announces as "Dane karty są kompletne".
async function fillCard(page: Page, number: string) {
  const card = page
    .getByTestId('stripe-card-element')
    .locator('iframe')
    .first()
    .contentFrame()
  const input = (name: string) => card.locator(`input[name="${name}"]`)

  await expect(
    input('cardnumber'),
    "Stripe's Card Element did not load (Stripe.js from js.stripe.com, the pk_test_ key, the PaymentIntent's client_secret)",
  ).toBeVisible({ timeout: STRIPE_TIMEOUT })
  await input('cardnumber').pressSequentially(number)
  await input('exp-date').pressSequentially(expiry)
  await input('cvc').pressSequentially(cvc)
  const postal = input('postal')
  if (await postal.isVisible()) {
    await postal.pressSequentially(postalCode)
  }

  await expect(
    page.getByRole('main').getByText(checkoutCopy.cardComplete),
    'the Card Element never reported complete',
  ).toBeVisible({ timeout: 15_000 })
}

// Stripe shows the 3D Secure challenge in a modal of nested iframes
// (js.stripe.com -> hooks.stripe.com -> its test ACS page). The nesting is
// Stripe's and has changed before, so the test page's "Complete" button is
// looked for in every frame of the page instead of along a fixed path.
async function completeThreeDSecureChallenge(page: Page) {
  let completeButton: Locator | undefined
  await expect
    .poll(
      async () => {
        const candidates = page
          .frames()
          .map((frame) => frame.locator('#test-source-authorize-3ds'))
        const visible = await Promise.all(
          candidates.map((candidate) =>
            // A frame that went away while it was looked at counts as no
            candidate.isVisible().catch(() => false),
          ),
        )
        completeButton = candidates.find((_, index) => visible[index])
        return completeButton !== undefined
      },
      {
        message:
          "Stripe's 3D Secure test page (#test-source-authorize-3ds) did not appear",
        timeout: STRIPE_TIMEOUT,
      },
    )
    .toBe(true)
  await completeButton?.click()
}

// No trace: it would keep Stripe's API traffic, the PaymentIntent's
// client_secret and the publishable key, and the report is uploaded as an
// artifact. Stripe's messages in English (the Stripe.js locale follows the
// browser's); the storefront's own copy follows the URL's country. File
// level, because `trace` can't be changed inside a describe group.
test.use({ trace: 'off', locale: 'en-US' })

test.describe(
  'guest checkout with a Stripe test card',
  { tag: ['@medusa', '@stripe'] },
  () => {
    // playwright.config.ts already leaves @stripe out without the key; this
    // only explains a skip when the spec is selected some other way
    test.skip(
      !hasStripe,
      'E2E_STRIPE_KEY (a pk_test_ key) is not set: the @stripe specs run in GitHub Actions with the Stripe test-mode secrets',
    )
    test.describe.configure({ timeout: 3 * 60_000 })

    test.beforeEach(async ({ request }) => {
      const api = storeApi(request)
      const region = await api.findRegionByCountry(country)
      expect(
        await api.listPaymentProviderIds(region.id),
        `The e2e Medusa has no ${payment.id} in its ${country} region: pass the sk_test_ key to the e2e-medusa action as stripe-secret-key (secret E2E_STRIPE_SECRET_KEY)`,
      ).toContain(payment.id)
    })

    test('pays with a card that succeeds and places the order', async ({
      page,
      request,
      gotoHydrated,
    }) => {
      const { customer, cartId } = await goToCardReview(
        page,
        gotoHydrated,
        'stripe-success',
      )

      await fillCard(page, cards.success)
      await expect(placeOrderButton(page)).toBeEnabled()
      await placeOrderButton(page).click()

      const orderId = await waitForConfirmation(page, country, STRIPE_TIMEOUT)
      const main = page.getByRole('main')
      await expect(main).toContainText(payment.label)
      await expect(main).toContainText(
        orderTotalPattern(priceText(total, country)),
      )
      await expectPlacedOrder(storeApi(request), {
        orderId,
        cartId,
        email: customer.email,
        product: shirt,
        size,
        currency: 'pln',
        total,
        providerId: payment.id,
      })
    })

    test('a declined card shows the error and places no order', async ({
      page,
      context,
      request,
      gotoHydrated,
    }) => {
      const { cartId } = await goToCardReview(
        page,
        gotoHydrated,
        'stripe-declined',
      )
      const completions: string[] = []
      page.on('request', (sent) => {
        if (
          sent.method() === 'POST' &&
          sent.url().includes(`/store/carts/${cartId}/complete`)
        ) {
          completions.push(sent.url())
        }
      })

      await fillCard(page, cards.declined)
      await placeOrderButton(page).click()

      const error = page
        .getByRole('main')
        .getByRole('alert')
        .filter({ hasText: checkoutCopy.paymentErrorTitle })
      await expect(error).toBeVisible({ timeout: STRIPE_TIMEOUT })
      // Stripe's own message for a generic decline
      await expect(error).toContainText(/declined/i)

      // Still on the review step, ready for another card
      await expect(page).toHaveURL(/[?&]step=review\b/)
      await expect(placeOrderButton(page)).toBeEnabled()
      expect(completions, 'the cart was never sent to Medusa').toEqual([])
      expect(await getCartId(context)).toBe(cartId)
      const cart = await storeApi(request).retrieveCart(cartId)
      expect(cart.completed_at, 'the cart is not completed').toBeFalsy()
    })

    test('a card that requires 3D Secure places the order after the challenge', async ({
      page,
      request,
      gotoHydrated,
    }) => {
      const { customer, cartId } = await goToCardReview(
        page,
        gotoHydrated,
        'stripe-3ds',
      )

      await fillCard(page, cards.threeDSecure)
      await placeOrderButton(page).click()
      await completeThreeDSecureChallenge(page)

      const orderId = await waitForConfirmation(page, country, STRIPE_TIMEOUT)
      await expectPlacedOrder(storeApi(request), {
        orderId,
        cartId,
        email: customer.email,
        product: shirt,
        size,
        currency: 'pln',
        total,
        providerId: payment.id,
      })
    })
  },
)
