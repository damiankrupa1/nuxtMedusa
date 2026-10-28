// Payload's image URLs are on a separate host from this app; @nuxt/image
// needs it allow-listed to run them through its own image optimizer —
// without this, NuxtImg silently falls back to serving them unoptimized.
// Payload can serve files from a bucket (its S3_FILE_URL) instead of its own
// origin, so NUXT_PUBLIC_PAYLOAD_IMAGE_HOSTS lists extra hostnames
// (comma-separated) next to the Payload host itself.
const payloadImageDomains = (() => {
  const domains = (process.env.NUXT_PUBLIC_PAYLOAD_IMAGE_HOSTS ?? '')
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean)
  if (process.env.NUXT_PUBLIC_PAYLOAD_URL) {
    try {
      domains.push(new URL(process.env.NUXT_PUBLIC_PAYLOAD_URL).hostname)
    } catch {
      // An invalid Payload URL is reported where it is used (fetchGlobal).
    }
  }
  return domains
})()

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/medusa',
    '@nuxt/ui',
    '@nuxt/image',
    '@nuxt/eslint',
    '@nuxtjs/i18n',
    '@nuxtjs/sitemap',
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
      // Payload CMS base URL. Its Navigation/FooterContent globals are
      // public read-only today, so this is safe to expose; an admin/API key
      // would instead go server-only and behind a server/api/cms proxy.
      payloadUrl: process.env.NUXT_PUBLIC_PAYLOAD_URL || '',
    },
  },

  routeRules: {
    '/**/products/**': { ssr: true },
    '/**/collections/**': { ssr: true },
    '/**/categories/**': { ssr: true },
    '/**/search': { ssr: true },
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
    typedPages: true,
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
    families: [
      { name: 'Inter', provider: 'google', weights: [400, 500, 600] },
      {
        name: 'Cormorant Garamond',
        provider: 'google',
        weights: [400],
        styles: ['normal', 'italic'],
      },
    ],
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

  image: {
    domains: payloadImageDomains,
  },

  medusa: {
    baseUrl: process.env.NUXT_PUBLIC_MEDUSA_BACKEND_URL,
    publishableKey: process.env.NUXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
    server: true,
  },

  // /sitemap.xml lists only the Medusa-backed catalog pages of every country
  // (server/api/__sitemap__/urls.get.ts). The pages/ scan is off: it can't
  // expand [countryCode]/[handle] and would only add `/`, a redirect.
  // Absolute URLs use NUXT_PUBLIC_SITE_URL (nuxt-site-config), else the
  // request origin.
  sitemap: {
    excludeAppSources: true,
    sources: ['/api/__sitemap__/urls'],
  },
})
