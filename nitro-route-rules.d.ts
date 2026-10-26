// Nuxt 3.16 adds `ssr` to Nitro's route rules by augmenting `nitropack`.
// nuxt-site-config and @nuxtjs/sitemap (installed for #11) augment
// `nitropack/types` as well, and from then on the Nuxt augmentation no
// longer reaches `routeRules` in nuxt.config.ts — a type-only problem, the
// build reads the rules fine. Declared again on `nitropack/types` so
// nuxt.config.ts type-checks; remove once Nuxt is upgraded and vue-tsc
// accepts `ssr` without it.
import 'nitropack/types'

declare module 'nitropack/types' {
  interface NitroRouteConfig {
    ssr?: boolean
  }
}
