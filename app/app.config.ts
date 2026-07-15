export default defineAppConfig({
  title: 'Fashion',
  defaultCountry: 'pl',
  defaultProductsPerPage: 12,
  homepageCollections: ['latest-drops', 'weekly-picks', 'sale'],
  ui: {
    colors: {
      primary: 'blue',
      neutral: 'zinc',
    },
  },
})
