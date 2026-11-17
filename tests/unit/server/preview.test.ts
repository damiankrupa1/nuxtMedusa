// @vitest-environment node
import { describe, expect, it } from 'vitest'

import {
  buildPreviewEntryLocation,
  buildPreviewHeaders,
  isPreviewRequest,
  matchesPreviewEntry,
  parseFrameAncestors,
  resolvePreviewConfig,
  resolvePreviewCountry,
} from '~~/server/utils/preview'
import {
  previewEntryQuerySchema,
  previewDraftQuerySchema,
} from '~/types/preview'
import {
  previewRuntimeConfig,
  TEST_API_KEY,
  TEST_PREVIEW_SECRET,
} from '~~/tests/unit/server/preview-harness'

describe('isPreviewRequest', () => {
  it.each([
    '/api/preview',
    '/api/preview/',
    '/api/preview?token=x',
    '/api/preview/session',
    '/api/preview/cms/navigation?locale=pl',
    '/API/Preview/cms/navigation',
    '//api//preview/cms/navigation',
    '/api/%70review/cms/navigation',
    '/pl?preview=1',
    '/pl?preview',
    '/pl/store?page=2&preview=0',
  ])('is a preview request: %s', (path) => {
    expect(isPreviewRequest(path)).toBe(true)
  })

  it.each([
    undefined,
    '',
    '/',
    '/pl',
    '/api/cms/navigation?locale=pl&draft=true',
    '/api/previews',
    '/pl/preview',
    '/pl?previewed=1',
    '/pl?q=preview',
    '/api/%E0%A4%A',
  ])('is not a preview request: %s', (path) => {
    expect(isPreviewRequest(path)).toBe(false)
  })
})

describe('parseFrameAncestors', () => {
  it('keeps https origins and normalises them', () => {
    expect(
      parseFrameAncestors(
        ' https://Admin.Example.com , https://admin-preview.example.com:8443,https://admin.example.com:443',
      ),
    ).toEqual([
      'https://admin.example.com',
      'https://admin-preview.example.com:8443',
    ])
  })

  it.each([
    '*',
    'https://*.example.com',
    'http://admin.example.com',
    'admin.example.com',
    'https://admin.example.com/app/cms',
    'https://admin.example.com?x=1',
    'https://user:pass@admin.example.com',
    "'self'",
    "https://a.example.com; script-src 'unsafe-inline'",
    'javascript:alert(1)',
    'data:text/html,x',
  ])('drops an entry that is not a plain https origin: %s', (entry) => {
    expect(parseFrameAncestors(entry)).toEqual([])
  })

  it('allows http://localhost only when asked to (development)', () => {
    expect(parseFrameAncestors('http://localhost:9000')).toEqual([])
    expect(
      parseFrameAncestors('http://localhost:9000, http://evil.example.com', {
        allowHttpLocalhost: true,
      }),
    ).toEqual(['http://localhost:9000'])
  })

  it('is empty for an empty or missing value', () => {
    expect(parseFrameAncestors('')).toEqual([])
    expect(parseFrameAncestors(undefined)).toEqual([])
  })
})

describe('resolvePreviewConfig', () => {
  it('is enabled with a long enough secret and an API key, and lists Payload and the admin', () => {
    expect(resolvePreviewConfig(previewRuntimeConfig())).toEqual({
      enabled: true,
      secret: TEST_PREVIEW_SECRET,
      apiKey: TEST_API_KEY,
      apiKeyCollection: 'service-users',
      payloadUrl: 'https://cms.example.com/',
      frameAncestors: ['https://cms.example.com', 'https://admin.example.com'],
    })
  })

  it.each([
    ['no secret', { secret: '' }],
    ['a short secret', { secret: 'x'.repeat(31) }],
    ['no API key', { apiKey: '' }],
    ['a blank API key', { apiKey: '   ' }],
    ['an invalid API key collection', { apiKeyCollection: 'users API-Key' }],
  ])('is disabled with %s', (_name, override) => {
    expect(resolvePreviewConfig(previewRuntimeConfig(override)).enabled).toBe(
      false,
    )
  })

  it('is disabled without any preview config', () => {
    expect(resolvePreviewConfig({ public: { payloadUrl: '' } })).toMatchObject({
      enabled: false,
      frameAncestors: [],
    })
  })

  it('defaults the API key collection to service-users', () => {
    expect(
      resolvePreviewConfig(previewRuntimeConfig({ apiKeyCollection: '' }))
        .apiKeyCollection,
    ).toBe('service-users')
  })

  it('takes the origin of a Payload URL with a path, and refuses a plain http one outside development', () => {
    const withPath = resolvePreviewConfig({
      ...previewRuntimeConfig({ frameAncestors: '' }),
      public: { payloadUrl: 'https://example.com/cms/' },
    })
    const http = resolvePreviewConfig({
      ...previewRuntimeConfig({ frameAncestors: '' }),
      public: { payloadUrl: 'http://localhost:3000' },
    })
    const httpDev = resolvePreviewConfig(
      {
        ...previewRuntimeConfig({ frameAncestors: '' }),
        public: { payloadUrl: 'http://localhost:3000' },
      },
      { dev: true },
    )

    expect(withPath.frameAncestors).toEqual(['https://example.com'])
    expect(http.frameAncestors).toEqual([])
    expect(httpDev.frameAncestors).toEqual(['http://localhost:3000'])
  })
})

describe('buildPreviewHeaders', () => {
  it('is private, no-store, noindex and replaces frame-ancestors as one policy', () => {
    expect(
      buildPreviewHeaders([
        'https://cms.example.com',
        'https://admin.example.com',
      ]),
    ).toEqual({
      'cache-control': 'private, no-store',
      'x-robots-tag': 'noindex, nofollow',
      'referrer-policy': 'no-referrer',
      'content-security-policy':
        "frame-ancestors 'self' https://cms.example.com https://admin.example.com",
    })
  })

  it('leaves the default policy alone without frame ancestors (preview disabled)', () => {
    expect(buildPreviewHeaders()).not.toHaveProperty('content-security-policy')
  })
})

describe('resolvePreviewCountry', () => {
  const countries = ['de', 'fr', 'pl']

  it('maps pl to the Polish country and en to the first other one', () => {
    expect(resolvePreviewCountry('pl', countries, 'pl')).toBe('pl')
    expect(resolvePreviewCountry('en', countries, 'pl')).toBe('de')
  })

  it('falls back to the default country when no region country matches', () => {
    expect(resolvePreviewCountry('pl', ['de'], 'pl')).toBe('pl')
    expect(resolvePreviewCountry('en', ['pl'], 'pl')).toBe('pl')
    expect(resolvePreviewCountry('en', [], 'pl')).toBe('pl')
  })
})

describe('buildPreviewEntryLocation', () => {
  it('puts the marker in the query and the token in the fragment', () => {
    expect(buildPreviewEntryLocation('pl', '/', 'a.b.c')).toBe(
      '/pl?preview=1#token=a.b.c',
    )
    expect(buildPreviewEntryLocation('de', '/store', 'a.b-c_d')).toBe(
      '/de/store?preview=1#token=a.b-c_d',
    )
  })
})

describe('matchesPreviewEntry', () => {
  const claims = {
    sub: '1',
    iat: 0,
    exp: 1,
    global: 'navigation',
    locale: 'pl',
  }
  const query = { token: 'a.b.c', locale: 'pl' as const, path: '/' }

  it('accepts the global and locale the token was issued for', () => {
    expect(
      matchesPreviewEntry(claims, { ...query, global: 'navigation' }),
    ).toBe(true)
    expect(matchesPreviewEntry(claims, query)).toBe(true)
  })

  it('refuses another locale or global', () => {
    expect(matchesPreviewEntry(claims, { ...query, locale: 'en' })).toBe(false)
    expect(matchesPreviewEntry(claims, { ...query, global: 'brands' })).toBe(
      false,
    )
    expect(matchesPreviewEntry({ ...claims, locale: undefined }, query)).toBe(
      false,
    )
  })
})

describe('preview request schemas', () => {
  it('parses the entry link Payload builds', () => {
    expect(
      previewEntryQuerySchema.parse({
        token: 'a.b.c',
        locale: 'en',
        path: '/',
        global: 'footer-content',
      }),
    ).toEqual({
      token: 'a.b.c',
      locale: 'en',
      path: '/',
      global: 'footer-content',
    })
  })

  it.each([
    '//evil.example.com',
    'https://evil.example.com',
    '/\\evil.example.com',
    '/store?x=1',
    '/store#x',
    '/../admin',
    'store',
    '/a//b',
  ])('refuses a path that could leave the storefront: %s', (path) => {
    expect(
      previewEntryQuerySchema.safeParse({ token: 'a.b.c', locale: 'pl', path })
        .success,
    ).toBe(false)
  })

  it('refuses an unknown locale and a missing token', () => {
    expect(
      previewEntryQuerySchema.safeParse({ token: 'a.b.c', locale: 'de' })
        .success,
    ).toBe(false)
    expect(previewEntryQuerySchema.safeParse({ locale: 'pl' }).success).toBe(
      false,
    )
  })

  it('has no draft parameter in the draft query: it is dropped like any other', () => {
    expect(
      previewDraftQuerySchema.parse({
        locale: 'pl',
        depth: '1',
        draft: 'false',
      }),
    ).toEqual({ locale: 'pl', depth: 1 })
  })
})
