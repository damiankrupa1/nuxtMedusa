import * as Sentry from '@sentry/nuxt'

import { buildSentryOptions } from '~/utils/sentry'

// Server side of the Sentry setup (loaded by the @sentry/nuxt module). The
// module reports unexpected Nitro errors (5xx, not 3xx/4xx); handler errors
// and external-system errors arrive through captureError(). Runtime config
// isn't available this early, so the settings come straight from the
// environment. Without a DSN nothing is initialised.
const options = buildSentryOptions({
  dsn: process.env.SENTRY_DSN || process.env.NUXT_PUBLIC_SENTRY_DSN,
  environment:
    process.env.NUXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.VERCEL_ENV,
  release:
    process.env.NUXT_PUBLIC_SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA,
  tracesSampleRate: process.env.NUXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
})

if (options) {
  Sentry.init(options)
}
