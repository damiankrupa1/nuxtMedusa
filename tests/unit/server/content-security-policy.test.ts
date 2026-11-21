import { describe, expect, it } from 'vitest'

import type { SecurityHeadersRuntimeConfigInput } from '~/types/security'
import {
  buildContentSecurityPolicy,
  buildContentSecurityPolicyHeaders,
  parseCspHostSources,
  parseCspReportUri,
  serializeCsp,
  toCspHostSource,
} from '~~/server/utils/content-security-policy'

const directives = (policy: string) =>
  Object.fromEntries(
    policy.split('; ').map((directive) => {
      const [name, ...sources] = directive.split(' ')
      return [name, sources]
    }),
  )

// What the production storefront is configured with, roughly (hosts are
// examples, not the real ones)
const production: SecurityHeadersRuntimeConfigInput = {
  csp: {
    reportUri: '',
    imgSrc: 'https://files.example.com/static, cdn.example.net',
    payloadImageHosts: 'bucket.example.com',
  },
  public: {
    medusa: { backendUrl: 'https://api.example.com/' },
    payloadUrl: 'https://cms.example.com/',
    sentry: { dsn: 'https://publickey@o123.ingest.de.sentry.io/456' },
  },
}

describe('Content-Security-Policy-Report-Only', () => {
  it('builds the whole policy from the runtime config', () => {
    expect(buildContentSecurityPolicy(production)).toBe(
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://js.stripe.com https://*.js.stripe.com https://geowidget.inpost.pl",
        "style-src 'self' 'unsafe-inline' https://geowidget.inpost.pl",
        "img-src 'self' data: blob: https://api.example.com https://cms.example.com bucket.example.com https://files.example.com cdn.example.net",
        "font-src 'self'",
        "connect-src 'self' https://api.stripe.com https://api.example.com https://o123.ingest.de.sentry.io",
        'frame-src https://js.stripe.com https://*.js.stripe.com https://hooks.stripe.com https://geowidget-app.inpost.pl',
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; '),
    )
  })

  it('needs nothing configured and then allows only our own origin and the fixed hosts', () => {
    const policy = directives(buildContentSecurityPolicy({ public: {} }))

    expect(policy['connect-src']).toEqual(["'self'", 'https://api.stripe.com'])
    expect(policy['img-src']).toEqual(["'self'", 'data:', 'blob:'])
    expect(policy['report-uri']).toBeUndefined()
  })

  it('keeps the Sentry key out of the policy and only takes the ingest origin', () => {
    const policy = buildContentSecurityPolicy(production)

    expect(policy).not.toContain('publickey')
    expect(directives(policy)['connect-src']).toContain(
      'https://o123.ingest.de.sentry.io',
    )
  })

  it('does not let the browser call Payload directly (#42)', () => {
    expect(
      directives(buildContentSecurityPolicy(production))['connect-src'],
    ).not.toContain('https://cms.example.com')
  })

  it('leaves out what browsers ignore in a report-only policy', () => {
    const policy = buildContentSecurityPolicy(production)

    expect(policy).not.toContain('frame-ancestors')
    expect(policy).not.toContain('upgrade-insecure-requests')
    expect(policy).not.toContain('sandbox')
  })

  it('has no per-request part: the same config gives the same header', () => {
    expect(buildContentSecurityPolicy(structuredClone(production))).toBe(
      buildContentSecurityPolicy(production),
    )
    expect(buildContentSecurityPolicy(production)).not.toMatch(/nonce-/)
  })

  it('ignores invalid URLs instead of failing', () => {
    const policy = directives(
      buildContentSecurityPolicy({
        csp: { reportUri: 'not a url', imgSrc: '*, https:, ;script-src *' },
        public: {
          medusa: { backendUrl: 'not a url' },
          payloadUrl: 'ftp://cms.example.com',
          sentry: { dsn: '' },
        },
      }),
    )

    expect(policy['img-src']).toEqual(["'self'", 'data:', 'blob:'])
    expect(policy['connect-src']).toEqual(["'self'", 'https://api.stripe.com'])
    expect(policy['report-uri']).toBeUndefined()
  })

  it('lists each source once', () => {
    const policy = directives(
      buildContentSecurityPolicy({
        csp: { imgSrc: 'https://cms.example.com, https://cms.example.com/x' },
        public: { payloadUrl: 'https://cms.example.com' },
      }),
    )

    expect(policy['img-src']).toEqual([
      "'self'",
      'data:',
      'blob:',
      'https://cms.example.com',
    ])
  })
})

describe('report target', () => {
  it('sends no report anywhere by default', () => {
    expect(buildContentSecurityPolicyHeaders(production)).toEqual({
      'content-security-policy-report-only':
        buildContentSecurityPolicy(production),
    })
  })

  it('adds report-uri, report-to and Reporting-Endpoints when NUXT_CSP_REPORT_URI is set', () => {
    const reportUri =
      'https://o123.ingest.de.sentry.io/api/456/security/?sentry_key=publickey'
    const headers = buildContentSecurityPolicyHeaders({
      ...production,
      csp: { ...production.csp, reportUri },
    })

    const policy = directives(headers['content-security-policy-report-only']!)
    expect(policy['report-uri']).toEqual([reportUri])
    expect(policy['report-to']).toEqual(['csp-endpoint'])
    expect(headers['reporting-endpoints']).toBe(`csp-endpoint="${reportUri}"`)
  })

  it.each([
    ['https://csp.example.com/report', 'https://csp.example.com/report'],
    ['http://localhost:8787/csp', 'http://localhost:8787/csp'],
    ['http://127.0.0.1:8787/csp', 'http://127.0.0.1:8787/csp'],
    ['http://csp.example.com/report', null],
    ['https://user:pass@csp.example.com/report', null],
    ['https://csp.example.com/report; script-src *', null],
    ['https://csp.example.com/a,b', null],
    ['https://csp.example.com/"x', null],
    ['javascript:alert(1)', null],
    ['', null],
    [undefined, null],
  ])('accepts %s as %s', (value, expected) => {
    expect(parseCspReportUri(value)).toBe(expected)
  })
})

describe('host lists', () => {
  it.each([
    ['https://files.example.com/static/', 'https://files.example.com'],
    ['http://localhost:9000', 'http://localhost:9000'],
    ['bucket.example.com', 'bucket.example.com'],
    ['Bucket.Example.com:8443', 'bucket.example.com:8443'],
    ['*.example.com', '*.example.com'],
    ['*', null],
    ['https:', null],
    ["'unsafe-inline'", null],
    ['data:', null],
    ['example.com/path', null],
    ['a b', null],
    ['ftp://files.example.com', null],
  ])('reads %s as %s', (value, expected) => {
    expect(toCspHostSource(value)).toBe(expected)
  })

  it('splits a comma-separated list and drops empty and invalid entries', () => {
    expect(
      parseCspHostSources(' a.example.com, ,*, https://b.example.com/x'),
    ).toEqual(['a.example.com', 'https://b.example.com'])
    expect(parseCspHostSources(undefined)).toEqual([])
  })

  it('serialises directives in the order given', () => {
    expect(serializeCsp({ 'b-src': ["'self'"], 'a-src': ["'none'"] })).toBe(
      "b-src 'self'; a-src 'none'",
    )
  })
})
