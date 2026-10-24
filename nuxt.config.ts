// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // TODO(#11): SEO — sitemap with products per country, robots.txt rules
  // (public/robots.txt is empty), canonical + hreflang between the country
  // versions of a page, Product structured data. Use @nuxtjs/sitemap and
  // nuxt-schema-org, or @nuxtjs/seo without nuxt-og-image (too heavy).
  modules: [
    '@nuxtjs/medusa',
    '@nuxt/ui',
    '@nuxt/image',
    '@nuxt/eslint',
    '@nuxtjs/i18n',
  ],

  devtools: { enabled: true },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
  },

  css: ['~/assets/css/main.css', '~/assets/css/variables.css'],

  ui: {
    colorMode: false,
  },

  runtimeConfig: {
    public: {
      stripeKey: process.env.NUXT_PUBLIC_STRIPE_KEY || '',
      inpostGeowidgetToken:
        process.env.NUXT_PUBLIC_INPOST_GEOWIDGET_TOKEN || '',
    },
  },

  routeRules: {
    '/**/products/**': { ssr: true },
    '/**/collections/**': { ssr: true },
    '/**/categories/**': { ssr: true },
    '/**/account': { ssr: true },
    '/**/store': { ssr: true },
    '/**/cart': { ssr: true },
    '/**/checkout': { ssr: true },
  },

  future: {
    compatibilityVersion: 4,
  },

  experimental: {
    payloadExtraction: true,
  },

  compatibilityDate: '2026-07-25',

  nitro: {
    rollupConfig: {
      context: 'globalThis',
    },
  },

  eslint: {
    config: {
      stylistic: true,
    },
  },

  fonts: {
    families: [{ name: 'Inter', provider: 'google', weights: [400, 500, 600] }],
  },

  i18n: {
    strategy: 'no_prefix',
    defaultLocale: 'en',
    locales: [
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'pl', name: 'Polski', file: 'pl.json' },
    ],
    restructureDir: 'i18n',
    langDir: 'locales',
    detectBrowserLanguage: false,
  },

  icon: {
    // Only collections whose icons can't be found by scanning the source go
    // into the server function: lucide for Nuxt UI's own icons and flag for
    // the country flags picked at runtime. The rest is bundled per icon.
    serverBundle: { collections: ['lucide', 'flag'] },
    clientBundle: { scan: true },
  },

  medusa: {
    baseUrl: process.env.NUXT_PUBLIC_MEDUSA_BACKEND_URL,
    publishableKey: process.env.NUXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
    server: true,
  },
})
