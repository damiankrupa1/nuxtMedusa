import type { Breadcrumb, ErrorEvent } from '@sentry/nuxt'

import type { SentryConfigInput } from '~/types/sentry'

// Pure helpers behind captureError() and the two Sentry init files
// (sentry.client.config.ts, sentry.server.config.ts), kept free of the Sentry
// runtime so they can be unit-tested and imported from either side.

export const SENTRY_FILTERED = '[Filtered]'

// Keys whose value never goes to Sentry, wherever they show up in the extra
// data or in a breadcrumb: customer, address, parcel locker, cart, payment and
// credential fields.
const SENSITIVE_KEY =
  /e-?mail|phone|password|token|secret|authorization|cookie|jwt|first_?name|last_?name|full_?name|address|postal|zip|city|street|billing|shipping|card|iban|locker|parcel|cart|customer/i

// Request headers that may stay on an event; everything else (cookies,
// Authorization, the Medusa publishable key, forwarded IPs, ...) is dropped.
const ALLOWED_HEADERS = ['user-agent', 'accept', 'accept-language', 'host']

const MAX_DEPTH = 5

// Medusa's 4xx answers are the shopper's to fix (bad input, wrong password,
// missing product). 408 and 429 are not: they mean the backend is struggling.
const NOT_EXPECTED_STATUSES = [408, 429]

const STRIPE_CUSTOMER_ERROR_TYPES = ['card_error', 'validation_error']

const SECRET_PATTERNS: [RegExp, string][] = [
  [/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, '[email]'],
  [/\bBearer\s+[\w.~+/=-]+/gi, 'Bearer [token]'],
  [/\beyJ[\w-]+\.[\w-]+\.[\w-]+/g, '[jwt]'],
  // Stripe client secrets (pi_xxx_secret_yyy, seti_..., src_...), which also
  // sit in the query string Przelewy24 redirects back with
  [/\b[a-z]{2,5}_[A-Za-z0-9]+_secret_[A-Za-z0-9]+/g, '[stripe_secret]'],
  // Medusa ids that are enough to look at a cart, order or customer
  [/\b(cart|order|ord|cus|payses|pay)_[0-9A-Za-z]{20,}/g, '$1_[id]'],
]

function toNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

// The HTTP status of whatever the Medusa SDK, ofetch or h3 threw
function getStatus(error: unknown): number | undefined {
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

/**
 * Whether an error is the shopper's to fix and not ours: a Medusa/h3 4xx
 * answer (validation, wrong password, 404) or a Stripe card decline. Those
 * must not raise alerts; captureError() keeps them as breadcrumbs instead.
 */
export function isExpectedError(
  error: unknown,
  context: Record<string, unknown> = {},
): boolean {
  const status = getStatus(error)
  if (
    status !== undefined &&
    status >= 400 &&
    status < 500 &&
    !NOT_EXPECTED_STATUSES.includes(status)
  ) {
    return true
  }
  return (
    context.source === 'stripe' &&
    typeof context.type === 'string' &&
    STRIPE_CUSTOMER_ERROR_TYPES.includes(context.type)
  )
}

const TAG_KEYS: Record<string, string> = {
  source: 'source',
  type: 'error_type',
  code: 'error_code',
  declineCode: 'decline_code',
  global: 'cms_global',
}

/**
 * Maps the context a captureError() caller passes to Sentry: the known keys
 * (`source`, `type`, `code`, `declineCode`, `global`) become searchable tags,
 * anything else goes to `extra` (and through the key filter in beforeSend).
 */
export function toSentryContext(context: Record<string, unknown>): {
  tags: Record<string, string>
  extra: Record<string, unknown>
} {
  const tags: Record<string, string> = {}
  const extra: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(context)) {
    if (value === undefined) {
      continue
    }
    const tag = TAG_KEYS[key]
    if (
      tag &&
      (typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean')
    ) {
      tags[tag] = String(value).slice(0, 200)
    } else {
      extra[key] = value
    }
  }
  return { tags, extra }
}

/** Replaces e-mail addresses, tokens, secrets and Medusa ids inside a string. */
export function scrubString(value: string): string {
  return SECRET_PATTERNS.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    value,
  )
}

// Keeps the path, drops query string and fragment (they carry search terms,
// the Stripe return parameters, ...)
function scrubUrl(url: string): string {
  return scrubString(url.replace(/[?#].*$/, ''))
}

function scrubValue(value: unknown, key = '', depth = 0): unknown {
  if (SENSITIVE_KEY.test(key)) {
    return SENTRY_FILTERED
  }
  if (typeof value === 'string') {
    return /^(url|from|to)$/.test(key) ? scrubUrl(value) : scrubString(value)
  }
  if (depth >= MAX_DEPTH || typeof value !== 'object' || value === null) {
    return value
  }
  if (Array.isArray(value)) {
    return value.map((item) => scrubValue(item, key, depth + 1))
  }
  return Object.fromEntries(
    Object.entries(value).map(([name, item]) => [
      name,
      scrubValue(item, name, depth + 1),
    ]),
  )
}

function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
  return {
    ...breadcrumb,
    ...(breadcrumb.message && { message: scrubString(breadcrumb.message) }),
    ...(breadcrumb.data && {
      data: scrubValue(breadcrumb.data) as Breadcrumb['data'],
    }),
  }
}

/**
 * `beforeSend` for both Sentry inits. A shop handles personal data, so an
 * event leaves with no user, cookies, request body or query string, only a
 * few harmless headers, and with e-mails, tokens, Stripe secrets and cart or
 * order ids masked in messages, URLs, breadcrumbs and extra data. Returns a
 * scrubbed copy; the original event is left untouched.
 */
export function scrubSentryEvent<T extends ErrorEvent>(event: T): T {
  const scrubbed: T = { ...event }

  delete scrubbed.user

  if (scrubbed.request) {
    const { url, headers, method } = scrubbed.request
    scrubbed.request = {
      ...(method && { method }),
      ...(url && { url: scrubUrl(url) }),
      ...(headers && {
        headers: Object.fromEntries(
          Object.entries(headers).filter(([name]) =>
            ALLOWED_HEADERS.includes(name.toLowerCase()),
          ),
        ),
      }),
    }
  }

  if (scrubbed.message) {
    scrubbed.message = scrubString(scrubbed.message)
  }
  if (scrubbed.transaction) {
    scrubbed.transaction = scrubUrl(scrubbed.transaction)
  }
  if (scrubbed.exception?.values) {
    scrubbed.exception = {
      ...scrubbed.exception,
      values: scrubbed.exception.values.map((exception) => ({
        ...exception,
        ...(exception.value && { value: scrubString(exception.value) }),
      })),
    }
  }
  if (scrubbed.extra) {
    scrubbed.extra = scrubValue(scrubbed.extra) as T['extra']
  }
  if (scrubbed.breadcrumbs) {
    scrubbed.breadcrumbs = scrubbed.breadcrumbs.map(scrubBreadcrumb)
  }

  return scrubbed
}

// '0.1' -> 0.1; empty or invalid -> undefined, which leaves tracing off
function parseSampleRate(value: string | number | undefined) {
  const rate = typeof value === 'string' ? Number.parseFloat(value) : value
  return rate !== undefined && Number.isFinite(rate) && rate > 0 && rate <= 1
    ? rate
    : undefined
}

/**
 * The options both Sentry inits share, or `null` without a DSN, in which case
 * the inits skip Sentry altogether and the app only logs to the console.
 * Tracing stays off until a sample rate is set (it costs function time and
 * Sentry quota on Vercel).
 */
export function buildSentryOptions(input: SentryConfigInput) {
  const dsn = input.dsn?.trim()
  if (!dsn) {
    return null
  }
  return {
    dsn,
    environment: input.environment || process.env.NODE_ENV || 'production',
    release: input.release || undefined,
    sendDefaultPii: false,
    tracesSampleRate: parseSampleRate(input.tracesSampleRate),
    beforeSend: scrubSentryEvent,
  }
}
