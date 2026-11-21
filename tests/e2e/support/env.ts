// Environment of the e2e suite. It reads only E2E_* variables, never the
// NUXT_PUBLIC_* ones a developer may have exported or kept in .env (a `.env`
// file never overrides a variable that is already defined, even an empty one,
// so every variable the build reads is set explicitly below).
//
// Variables (all optional):
//   E2E_APP_PORT              port of the preview server (default 3100)
//   E2E_PAYLOAD_STUB_PORT     port of the local Payload stub (default 4010)
//   E2E_MEDUSA_BACKEND_URL    Medusa base URL; without it every @medusa spec is skipped
//   E2E_MEDUSA_PUBLISHABLE_KEY  Store publishable key for that Medusa
//   E2E_STRIPE_KEY            Stripe publishable test key (pk_test_...); without it every @stripe spec is skipped
//   E2E_SKIP_BUILD            1 = reuse the existing .output instead of running `pnpm build`
//   E2E_ALL_BROWSERS          1 = also run Firefox and WebKit (Chromium always runs)

export const appPort = Number(process.env.E2E_APP_PORT ?? 3100)
export const payloadStubPort = Number(process.env.E2E_PAYLOAD_STUB_PORT ?? 4010)

export const appUrl = `http://127.0.0.1:${appPort}`
export const payloadStubUrl = `http://127.0.0.1:${payloadStubPort}`

export const medusaBackendUrl = process.env.E2E_MEDUSA_BACKEND_URL ?? ''
export const medusaPublishableKey = process.env.E2E_MEDUSA_PUBLISHABLE_KEY ?? ''
export const hasMedusa = medusaBackendUrl !== ''
export const hasStripe = (process.env.E2E_STRIPE_KEY ?? '') !== ''
export const skipBuild = process.env.E2E_SKIP_BUILD === '1'
export const allBrowsers = process.env.E2E_ALL_BROWSERS === '1'

// Without a Medusa the app is still built (robots.txt and the CMS proxy don't
// need it) and pointed at a port nothing listens on, so a developer's own
// Medusa on :9000 is never hit by accident.
const unreachableMedusaUrl = 'http://127.0.0.1:1'

// Everything `nuxt build` and `nuxt preview` read from the environment.
// Public variables are baked into the build (and the image allow-list is read
// at build time), so the same object is used for both commands.
export const appEnv: Record<string, string> = {
  NODE_ENV: 'production',
  HOST: '127.0.0.1',
  NITRO_HOST: '127.0.0.1',
  PORT: String(appPort),
  NITRO_PORT: String(appPort),

  NUXT_PUBLIC_MEDUSA_BACKEND_URL: medusaBackendUrl || unreachableMedusaUrl,
  MEDUSA_URL: medusaBackendUrl || unreachableMedusaUrl,
  NUXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: medusaPublishableKey,
  NUXT_PUBLIC_STRIPE_KEY: process.env.E2E_STRIPE_KEY ?? '',
  NUXT_PUBLIC_INPOST_GEOWIDGET_TOKEN: '',

  // Editorial content always comes from the local stub, never a real Payload
  NUXT_PUBLIC_PAYLOAD_URL: payloadStubUrl,
  NUXT_PUBLIC_PAYLOAD_IMAGE_HOSTS: '',

  // Canonical/hreflang/sitemap URLs follow the request origin
  NUXT_PUBLIC_SITE_URL: '',

  // Monitoring off: no DSN, no source map upload, no Vercel-derived release
  NUXT_PUBLIC_SENTRY_DSN: '',
  SENTRY_DSN: '',
  NUXT_PUBLIC_SENTRY_ENVIRONMENT: '',
  NUXT_PUBLIC_SENTRY_RELEASE: '',
  NUXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: '',
  SENTRY_ORG: '',
  SENTRY_PROJECT: '',
  SENTRY_AUTH_TOKEN: '',
  VERCEL_ENV: '',
  VERCEL_GIT_COMMIT_SHA: '',
}
