// Reading what an HTTP call threw, whoever answered: the Medusa SDK's
// FetchError (`status`), h3's error (`statusCode`) or ofetch's FetchError
// (`statusCode`, `response.status`). Kept free of Nuxt and Sentry so that
// app/utils/sentry.ts (also loaded by the Sentry init files) can import it.

export const HTTP_STATUS_TOO_MANY_REQUESTS = 429

function toNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

// The HTTP status of whatever the Medusa SDK, ofetch or h3 threw
export function getErrorStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) {
    return undefined
  }
  const candidate = error as Record<string, unknown>
  const response = candidate.response as Record<string, unknown> | undefined
  return (
    toNumber(candidate.status) ??
    toNumber(candidate.statusCode) ??
    toNumber(response?.status)
  )
}

// A `429 Too Many Requests`, whoever answered it: a rate limit in front of
// the storefront (the Vercel firewall answers it before our handler runs, so
// its body is not our JSON error) or Medusa's, passed on by the
// server/api/customers handlers with its status.
export const isTooManyRequestsError = (error: unknown): boolean =>
  getErrorStatus(error) === HTTP_STATUS_TOO_MANY_REQUESTS
