import * as Sentry from '@sentry/nuxt'

import { isExpectedError, toSentryContext } from '~/utils/sentry'

/**
 * Reports an error the team should look into. Errors are reported once, where
 * they come from an external system, so this is the only place that talks to
 * Sentry. `context` becomes searchable tags (`source`, `type`, `code`,
 * `declineCode`, `global`) plus extra data. Without a Sentry DSN it only logs
 * to the console, as does development.
 *
 * Errors the shopper caused (Medusa 4xx, card declines) are not sent as events
 * so they raise no alerts; they stay as breadcrumbs on the next real event.
 */
export function captureError(
  error: unknown,
  context: Record<string, unknown> = {},
) {
  const enabled = Sentry.isEnabled()

  if (!enabled || process.env.NODE_ENV !== 'production') {
    console.error(error, context)
  }
  if (!enabled) {
    return
  }

  const { tags, extra } = toSentryContext(context)
  if (isExpectedError(error, context)) {
    Sentry.addBreadcrumb({
      category: 'expected-error',
      level: 'info',
      message: error instanceof Error ? error.message : String(error),
      data: tags,
    })
    return
  }
  Sentry.captureException(error, { tags, extra })
}
