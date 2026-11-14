// Catalog data the e2e suite expects the Medusa under test to contain (the
// medusaDemo e2e seed) and that the Payload stub refers to by handle. Each
// value can be overridden through its env variable when a staging Medusa uses
// other handles. Keep this file and the seed in sync: a handle that doesn't
// exist in Medusa makes the home page drop the section that uses it.

const fromEnv = (name: string, fallback: string) =>
  process.env[name] || fallback

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
  productHandle: fromEnv('E2E_PRODUCT_HANDLE', 'e2e-wool-coat'),
  // A product whose every variant is out of stock
  soldOutProductHandle: fromEnv('E2E_SOLD_OUT_PRODUCT_HANDLE', 'e2e-sold-out'),

  // Products the stub's shop-the-look global lists
  shopTheLookHandles: [
    fromEnv('E2E_PRODUCT_HANDLE', 'e2e-wool-coat'),
    fromEnv('E2E_SECOND_PRODUCT_HANDLE', 'e2e-linen-shirt'),
  ],

  // Handles that must not exist anywhere
  unknown: {
    product: 'e2e-no-such-product',
    category: 'e2e-no-such-category',
    collection: 'e2e-no-such-collection',
  },
}
