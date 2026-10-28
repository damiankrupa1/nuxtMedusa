import * as Sentry from '@sentry/nuxt'
import { useRuntimeConfig } from '#imports'

import { buildSentryOptions } from '~/utils/sentry'

// Browser side of the Sentry setup (loaded by the @sentry/nuxt module). The
// module itself reports Vue/Nuxt component errors and unhandled rejections;
// errors from external systems arrive through captureError(). Without
// NUXT_PUBLIC_SENTRY_DSN nothing is initialised.
const options = buildSentryOptions(useRuntimeConfig().public.sentry)

if (options) {
  Sentry.init(options)
}
