import type { BrowserContext, Page } from '@playwright/test'
import { expect } from '~~/tests/e2e/support/fixtures'
import type { storeApi } from '~~/tests/e2e/support/medusa'
import type { SeededProduct } from '~~/tests/e2e/support/test-data'

// Steps of the guest checkout (app/components/checkout/**), shared by the
// manual-payment and the Stripe specs. Plain functions on the page, as in the
// other helpers. Copy is the primary country's (i18n/locales/pl.json).
export const checkoutCopy = {
  // product.optionSelector.select, product.variantSelector.addToCart
  sizeGroup: 'Wybierz Size',
  addToCart: 'Dodaj do koszyka',
  // auth.fields, checkout.address.fields
  firstName: 'Imię',
  lastName: 'Nazwisko',
  address: 'Adres',
  postalCode: 'Kod pocztowy',
  city: 'Miasto',
  email: 'Email',
  phone: 'Telefon',
  // checkout.address.billingSameAsShipping
  billingSameAsShipping: 'Adres rozliczeniowy taki sam jak adres wysyłki',
  // checkout.address.continue, checkout.delivery.continue,
  // checkout.payment.continue, checkout.review.placeOrder
  toDelivery: 'Przejdź do dostawy',
  toPayment: 'Przejdź do płatności',
  toReview: 'Przejdź do podsumowania',
  placeOrder: 'Złóż zamówienie',
  // checkout.steps.reviewOrder
  reviewHeading: 'Podsumowanie zamówienia',
  // checkout.review.paymentErrorTitle, checkout.review.cardComplete
  paymentErrorTitle: 'Błąd płatności',
  cardComplete: 'Dane karty są kompletne',
  // pages.orderConfirmed
  thankYou: 'Dziękujemy!',
  orderPlaced: 'Twoje zamówienie zostało złożone pomyślnie.',
  orderNumber: 'Numer zamówienia:',
  // cart.table.total
  total: 'Razem',
}

export interface GuestCustomer {
  firstName: string
  lastName: string
  address: string
  postalCode: string
  city: string
  phone: string
  email: string
}

// A customer of its own per test, so tests can run in parallel
export function newGuestCustomer(prefix: string): GuestCustomer {
  return {
    firstName: 'Jan',
    lastName: 'Testowy',
    address: 'ul. Testowa 1',
    postalCode: '00-001',
    city: 'Warszawa',
    phone: '+48500100200',
    email: `e2e-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
  }
}

export async function getCartId(
  context: BrowserContext,
): Promise<string | undefined> {
  return (await context.cookies()).find((cookie) => cookie.name === 'cart_id')
    ?.value
}

// Adds one variant of a seeded product from its product page and waits until
// the header counts it. Returns the id of the cart it created.
export async function addToCart(
  page: Page,
  gotoHydrated: (path: string) => Promise<unknown>,
  {
    country,
    product,
    size,
  }: { country: string; product: SeededProduct; size: string },
): Promise<string> {
  const cartCount = page
    .getByRole('banner')
    .getByRole('link', { name: /^\(\d+\)$/ })

  await gotoHydrated(`/${country}/products/${product.handle}`)
  const main = page.getByRole('main')
  await main
    .getByRole('group', { name: checkoutCopy.sizeGroup })
    .getByRole('button', { name: size, exact: true })
    .click()
  await main.getByRole('button', { name: checkoutCopy.addToCart }).click()
  await expect(cartCount).toHaveText('(1)')

  const cartId = await getCartId(page.context())
  expect(cartId, 'adding to the cart sets the cart_id cookie').toMatch(/^cart_/)
  return cartId as string
}

// The address step, with the billing address the same as the shipping one.
// The country is preselected from the URL's country.
export async function fillAddressStep(page: Page, customer: GuestCustomer) {
  const main = page.getByRole('main')
  // By role: the accessible name leaves out the label's aria-hidden "*",
  // getByLabel() would match the label's whole text ("Imię*")
  const field = (name: string) =>
    main.getByRole('textbox', { name, exact: true })

  // Unchecked for a new cart: Medusa gives it a shipping address with only
  // the region's country, so it differs from the empty billing address and
  // the billing form is shown. Checking it hides that form.
  const sameAsShipping = main.getByRole('checkbox', {
    name: checkoutCopy.billingSameAsShipping,
  })
  await sameAsShipping.check()
  await expect(sameAsShipping).toBeChecked()

  await field(checkoutCopy.firstName).fill(customer.firstName)
  await field(checkoutCopy.lastName).fill(customer.lastName)
  await field(checkoutCopy.address).fill(customer.address)
  await field(checkoutCopy.postalCode).fill(customer.postalCode)
  await field(checkoutCopy.city).fill(customer.city)
  // The form has the phone field twice, both bound to the shipping phone
  await field(checkoutCopy.phone).first().fill(customer.phone)
  await field(checkoutCopy.email).fill(customer.email)

  await main.getByRole('button', { name: checkoutCopy.toDelivery }).click()
  await expect(page).toHaveURL(/[?&]step=delivery\b/)
}

// The delivery step: a shipping option by its name (Medusa's), e.g. "Standard"
export async function chooseDelivery(page: Page, optionName: string) {
  const main = page.getByRole('main')
  const option = main.getByRole('radio', {
    name: new RegExp(`^${optionName}\\b`),
  })
  await option.check()
  await expect(option).toBeChecked()

  await main.getByRole('button', { name: checkoutCopy.toPayment }).click()
  await expect(page).toHaveURL(/[?&]step=payment\b/)
}

// The payment step: a provider by the storefront's label. Continuing creates
// the payment session in Medusa (for Stripe, the PaymentIntent).
export async function choosePayment(page: Page, providerLabel: string) {
  const main = page.getByRole('main')
  const option = main.getByRole('radio', { name: providerLabel })
  await option.check()
  await expect(option).toBeChecked()

  await main.getByRole('button', { name: checkoutCopy.toReview }).click()
  await expect(page).toHaveURL(/[?&]step=review\b/)
}

export function placeOrderButton(page: Page) {
  return page
    .getByRole('main')
    .getByRole('button', { name: checkoutCopy.placeOrder })
}

const CONFIRMED_URL = /\/order\/(order_[^/]+)\/confirmed/

// Waits for the order confirmation page and returns the order id in its URL
export async function waitForConfirmation(
  page: Page,
  country: string,
  timeout?: number,
): Promise<string> {
  await expect(page).toHaveURL(
    new RegExp(`/${country}${CONFIRMED_URL.source}`),
    { timeout },
  )
  const orderId = CONFIRMED_URL.exec(page.url())?.[1]
  if (!orderId) {
    throw new Error(`No order id in the confirmation URL ${page.url()}`)
  }

  const main = page.getByRole('main')
  await expect(
    main.getByRole('heading', { level: 1, name: checkoutCopy.thankYou }),
  ).toBeVisible()
  await expect(main.getByText(checkoutCopy.orderPlaced)).toBeVisible()
  await expect(
    main.getByText(`${checkoutCopy.orderNumber} ${orderId}`),
  ).toBeVisible()
  return orderId
}

// The order total on the confirmation page: the "Razem" row of the totals
export function orderTotalPattern(price: RegExp): RegExp {
  return new RegExp(`${checkoutCopy.total}\\s*${price.source}`)
}

// What a completed checkout must have left in Medusa, read back through the
// Store API: the order with the single item exactly once, its total, one
// payment of the chosen provider, and the cart marked completed
export async function expectPlacedOrder(
  api: ReturnType<typeof storeApi>,
  expected: {
    orderId: string
    cartId: string
    email: string
    product: SeededProduct
    size: string
    currency: string
    total: number
    providerId: string
  },
) {
  const order = await api.retrieveOrder(expected.orderId)
  expect(order.email).toBe(expected.email)
  expect(order.currency_code).toBe(expected.currency)
  expect(order.total).toBeCloseTo(expected.total, 2)
  expect(order.items).toHaveLength(1)
  expect(order.items?.[0]).toMatchObject({
    product_handle: expected.product.handle,
    variant_title: expected.size,
    quantity: 1,
  })
  expect(
    order.payment_collections?.flatMap(
      (collection) =>
        collection.payments?.map(({ provider_id: providerId }) => providerId) ??
        [],
    ),
  ).toEqual([expected.providerId])

  const cart = await api.retrieveCart(expected.cartId)
  expect(cart.completed_at, 'the cart is completed').toBeTruthy()
}
