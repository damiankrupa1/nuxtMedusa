import type { EventHandler, EventHandlerRequest, H3Event } from 'h3'
import { captureError } from '~/utils/capture-error'
import type { MedusaError } from '~~/server/types/medusa-error'

export const defineWrappedResponseHandler = <T extends EventHandlerRequest, D>(
  handler: EventHandler<T, D>,
): EventHandler<T, D> =>
  defineEventHandler<T>(async (event: H3Event) => {
    try {
      return await handler(event)
    } catch (err) {
      // Reports unexpected failures; a 4xx from Medusa is the caller's to fix
      // and only becomes a breadcrumb. Linking the error as the cause stops
      // Sentry's Nitro error hook from reporting the wrapper a second time.
      captureError(err, { source: 'server-api' })

      // Handle Medusa errors with appropriate status codes
      const medusaError = err as MedusaError

      throw createError({
        statusCode: medusaError.status || 500,
        message: medusaError.message || 'Internal Server Error',
        cause: err,
      })
    }
  })
