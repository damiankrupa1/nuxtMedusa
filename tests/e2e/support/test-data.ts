// Catalog data the e2e suite expects the Medusa under test to contain (the
// medusaDemo e2e seed, apps/backend/src/scripts/e2e/data.ts) and that the
// Payload stub refers to by handle. Each handle can be overridden through its
// env variable when a staging Medusa uses other handles. Keep this file and
// the seed in sync: a handle that doesn't exist in Medusa makes the home page
// drop the section that uses it.

const fromEnv = (name: string, fallback: string) =>
  process.env[name] || fallback

const productHandle = fromEnv('E2E_PRODUCT_HANDLE', 'e2e-wool-coat')
const secondProductHandle = fromEnv(
  'E2E_SECOND_PRODUCT_HANDLE',
  'e2e-linen-shirt',
)
const soldOutProductHandle = fromEnv(
  'E2E_SOLD_OUT_PRODUCT_HANDLE',
  'e2e-sold-out',
)

export interface SeededProduct {
  handle: string
  title: string
  // Every variant has the same price, in major units per currency
  prices: { pln: number; eur: number }
  sizes: string[]
  colors: string[]
}

export const testData = {
  // Country routes of the two seeded regions: PL / PLN and a EUR one
  countries: {
    primary: fromEnv('E2E_COUNTRY_PRIMARY', 'pl'),
    secondary: fromEnv('E2E_COUNTRY_SECONDARY', 'de'),
  },

  // The category the stub's category-tiles card links to
  categoryHandle: fromEnv('E2E_CATEGORY_HANDLE', 'e2e-knitwear'),
  collectionHandle: fromEnv('E2E_COLLECTION_HANDLE', 'e2e-autumn'),

  // A product with several variants and no inventory management
  productHandle,
  // A product whose every variant is out of stock
  soldOutProductHandle,

  // Products the stub's shop-the-look global lists
  shopTheLookHandles: [productHandle, secondProductHandle],

  // The seeded products. None has an image, on purpose: the storefront must
  // render a product without a thumbnail.
  products: {
    // 6 variants (size x color), inventory not managed
    coat: {
      handle: productHandle,
      title: 'E2E Wool Coat',
      prices: { pln: 899, eur: 199 },
      sizes: ['S', 'M', 'L'],
      colors: ['Charcoal', 'Camel'],
    },
    // 3 sizes, inventory managed, plenty in stock
    shirt: {
      handle: secondProductHandle,
      title: 'E2E Linen Shirt',
      prices: { pln: 249, eur: 59 },
      sizes: ['S', 'M', 'L'],
      colors: [],
    },
    // 2 sizes, inventory managed, none in stock, no backorders
    soldOut: {
      handle: soldOutProductHandle,
      title: 'E2E Sold Out Sweater',
      prices: { pln: 499, eur: 119 },
      sizes: ['S', 'M'],
      colors: [],
    },
  } satisfies Record<string, SeededProduct>,

  // The seed's shipping option with the manual fulfillment provider (no
  // InPost parcel locker to pick), flat price per region
  shippingOptions: {
    standard: { name: 'Standard', prices: { pln: 14.99, eur: 9.99 } },
  },

  // Payment providers of the seeded regions: the manual one always, the
  // Stripe card one only when the e2e Medusa got a Stripe test secret key.
  // The labels are the storefront's (app/utils/payment.ts), not translated.
  paymentProviders: {
    manual: { id: 'pp_system_default', label: 'Manual Payment' },
    stripeCard: { id: 'pp_stripe_stripe', label: 'Credit card' },
  },

  // Handles that must not exist anywhere
  unknown: {
    product: 'e2e-no-such-product',
    category: 'e2e-no-such-category',
    collection: 'e2e-no-such-collection',
  },
}

// Currency and number format of each seeded country, as the storefront
// formats prices there (convertToLocale(): the country's locale)
const COUNTRY_FORMATS: Record<string, { locale: string; currency: string }> = {
  pl: { locale: 'pl-PL', currency: 'PLN' },
  de: { locale: 'de-DE', currency: 'EUR' },
}

// The price as the page shows it in that country, e.g. "899,00 zł", as a
// pattern that accepts any kind of space (Intl puts a no-break space before
// the currency, and ICU versions differ in which one)
export function priceText(amount: number, country: string): RegExp {
  const format = COUNTRY_FORMATS[country]
  if (!format) {
    throw new Error(`No price format for the country "${country}"`)
  }

  const text = new Intl.NumberFormat(format.locale, {
    style: 'currency',
    currency: format.currency,
  }).format(amount)
  const pattern = text
    .split(/\s/)
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('\\s')
  return new RegExp(pattern)
}
