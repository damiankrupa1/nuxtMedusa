export default defineAppConfig({
  title: 'Fashion',
  defaultCountry: 'pl',
  defaultProductsPerPage: 12,
  homepageCollections: ['latest-drops', 'weekly-picks', 'sale'],
  // Hand-picked for the "Shop the look" home section — no Medusa concept
  // for an editorial product grouping exists, see missing-cms-content skill.
  shopTheLookProductHandles: [
    'ema-coat-pink',
    'luiza-knit-sweater-white',
    'sabina-skinny-jeans-light-wash',
  ],
  ui: {
    colors: {
      primary: 'blue',
      neutral: 'zinc',
    },
  },
})
