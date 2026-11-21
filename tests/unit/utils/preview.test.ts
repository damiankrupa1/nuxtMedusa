import { beforeEach, describe, expect, it } from 'vitest'

import { PREVIEW_STORAGE_KEY } from '~/types/preview'
import {
  createPreviewUnauthorizedError,
  forgetPreviewSession,
  getLivePreviewHost,
  hasPreviewQuery,
  isPayloadDocumentEvent,
  isPreviewCacheKey,
  isPreviewUnauthorizedError,
  msUntilPreviewExpiry,
  parseStoredPreviewSession,
  readPreviewTokenFromHash,
  readStoredPreviewSession,
  removePreviewTokenFromAddressBar,
  storePreviewSession,
  toCmsCacheKey,
  toPayloadOrigin,
  withoutPreviewToken,
} from '~/utils/preview'

const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl'
const expiresAt = '2026-11-19T12:00:00.000Z'
const now = Date.parse('2026-11-19T11:00:00.000Z')

describe('preview token in the URL', () => {
  it('reads the token the entry redirect put in the fragment', () => {
    expect(readPreviewTokenFromHash(`#token=${token}`)).toBe(token)
    expect(
      readPreviewTokenFromHash(`#token=${encodeURIComponent(token)}`),
    ).toBe(token)
  })

  it.each([
    ['no fragment', ''],
    ['another fragment', '#journal'],
    ['an empty token', '#token='],
    ['something that is not a signed token', '#token=<script>'],
  ])('finds no token with %s', (_case, hash) => {
    expect(readPreviewTokenFromHash(hash)).toBeNull()
  })

  it('removes the token from an address and from a router path', () => {
    expect(
      withoutPreviewToken(
        `https://shop.example.com/pl?preview=1#token=${token}`,
      ),
    ).toBe('https://shop.example.com/pl?preview=1')
    expect(withoutPreviewToken(`/pl/store?preview=1#token=${token}`)).toBe(
      '/pl/store?preview=1',
    )
  })

  it('keeps any other fragment and leaves an address without a token alone', () => {
    expect(withoutPreviewToken(`/pl?preview=1#token=${token}&x=1`)).toBe(
      '/pl?preview=1#x=1',
    )
    expect(withoutPreviewToken('/pl#journal')).toBe('/pl#journal')
    expect(withoutPreviewToken('/pl?preview=1')).toBe('/pl?preview=1')
  })

  it('removes the token from the address bar and from the router state, without a new history entry', () => {
    window.history.replaceState(
      {
        back: '/pl',
        current: `/pl/store?preview=1#token=${token}`,
        position: 3,
      },
      '',
      `/pl/store?preview=1#token=${token}`,
    )
    const entries = window.history.length

    removePreviewTokenFromAddressBar(window)

    expect(window.location.pathname + window.location.search).toBe(
      '/pl/store?preview=1',
    )
    expect(window.location.hash).toBe('')
    expect(window.history.state).toEqual({
      back: '/pl',
      current: '/pl/store?preview=1',
      position: 3,
    })
    expect(window.history.length).toBe(entries)
  })

  it('cleans the address before the router has written its state', () => {
    window.history.replaceState(null, '', `/pl?preview=1#token=${token}`)

    removePreviewTokenFromAddressBar(window)

    expect(window.location.href).not.toContain(token)
    expect(window.history.state).toBeNull()
  })

  it('leaves an address without a token alone', () => {
    const state = { current: '/pl#journal' }
    window.history.replaceState(state, '', '/pl#journal')

    removePreviewTokenFromAddressBar(window)

    expect(window.location.hash).toBe('#journal')
    expect(window.history.state).toEqual(state)
  })

  it('recognises the preview marker in a query string', () => {
    expect(hasPreviewQuery('?preview=1')).toBe(true)
    expect(hasPreviewQuery('?page=2&preview')).toBe(true)
    expect(hasPreviewQuery('?page=2')).toBe(false)
    expect(hasPreviewQuery('')).toBe(false)
  })
})

describe('preview cache keys', () => {
  it('gives a draft its own key and leaves the published key unchanged', () => {
    expect(toCmsCacheKey('cms:navigation:pl', false)).toBe('cms:navigation:pl')
    expect(toCmsCacheKey('cms:navigation:pl', true)).toBe(
      'cms:navigation:pl:preview',
    )
  })

  it('recognises only CMS draft keys', () => {
    expect(isPreviewCacheKey('cms:navigation:pl:preview')).toBe(true)
    expect(isPreviewCacheKey('cms:shop-the-look:pl:region:reg_1:preview')).toBe(
      true,
    )
    expect(isPreviewCacheKey('cms:navigation:pl')).toBe(false)
    expect(isPreviewCacheKey('product:preview')).toBe(false)
  })
})

describe('stored preview session', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('accepts a well-formed session that has not expired', () => {
    const raw = JSON.stringify({ token, expiresAt })

    expect(parseStoredPreviewSession(raw, now)).toEqual({ token, expiresAt })
  })

  it.each([
    ['nothing', null],
    ['broken JSON', '{'],
    ['a missing token', JSON.stringify({ expiresAt })],
    ['a token that is not signed', JSON.stringify({ token: 'x', expiresAt })],
    ['an invalid date', JSON.stringify({ token, expiresAt: 'soon' })],
    [
      'an expired session',
      JSON.stringify({ token, expiresAt: '2026-11-19T10:59:59.000Z' }),
    ],
  ])('drops %s', (_case, raw) => {
    expect(parseStoredPreviewSession(raw, now)).toBeNull()
  })

  it('stores, reads and forgets the session in sessionStorage only', () => {
    const future = new Date(Date.now() + 60_000).toISOString()

    storePreviewSession({ token, expiresAt: future })
    expect(readStoredPreviewSession()).toEqual({ token, expiresAt: future })
    expect(localStorage.getItem(PREVIEW_STORAGE_KEY)).toBeNull()
    expect(document.cookie).not.toContain(token)

    forgetPreviewSession()
    expect(sessionStorage.getItem(PREVIEW_STORAGE_KEY)).toBeNull()
    expect(readStoredPreviewSession()).toBeNull()
  })

  it('counts the time left until expiry, never below zero', () => {
    expect(msUntilPreviewExpiry(expiresAt, now)).toBe(60 * 60 * 1000)
    expect(msUntilPreviewExpiry(expiresAt, now + 2 * 60 * 60 * 1000)).toBe(0)
    expect(msUntilPreviewExpiry('soon', now)).toBe(0)
  })
})

describe('preview errors', () => {
  it('marks a refused token without carrying the request', () => {
    const error = createPreviewUnauthorizedError()

    expect(isPreviewUnauthorizedError(error)).toBe(true)
    expect(JSON.stringify({ ...error, message: error.message })).not.toContain(
      'x-preview-token',
    )
    expect(isPreviewUnauthorizedError(new Error('401'))).toBe(false)
    expect(isPreviewUnauthorizedError({ statusCode: 401 })).toBe(false)
    expect(isPreviewUnauthorizedError(null)).toBe(false)
  })
})

describe('Live Preview messages', () => {
  const payloadOrigin = 'https://cms.example.com'
  const host = {} as Window
  const documentEvent = {
    origin: payloadOrigin,
    source: host,
    data: { type: 'payload-document-event', entitySlug: 'navigation' },
  }

  it('takes the origin of the Payload URL', () => {
    expect(toPayloadOrigin('https://cms.example.com/admin/')).toBe(
      payloadOrigin,
    )
    expect(toPayloadOrigin('')).toBeNull()
    expect(toPayloadOrigin(undefined)).toBeNull()
    expect(toPayloadOrigin('not a url')).toBeNull()
    expect(toPayloadOrigin('javascript:alert(1)')).toBeNull()
  })

  it('accepts a save event from Payload', () => {
    expect(isPayloadDocumentEvent(documentEvent, payloadOrigin, host)).toBe(
      true,
    )
  })

  it.each([
    ['another origin', { ...documentEvent, origin: 'https://evil.example' }],
    ['another window', { ...documentEvent, source: {} as Window }],
    [
      'another type',
      { ...documentEvent, data: { type: 'payload-live-preview' } },
    ],
    ['no data', { ...documentEvent, data: null }],
    ['a string', { ...documentEvent, data: 'payload-document-event' }],
  ])('ignores a message from %s', (_case, event) => {
    expect(isPayloadDocumentEvent(event, payloadOrigin, host)).toBe(false)
  })

  it('finds the Payload window like @payloadcms/live-preview: opener, then parent', () => {
    const parent = {} as Window
    const opener = {} as Window
    const framed = { parent, opener: null } as unknown as Window
    const popup = { parent: null, opener } as unknown as Window
    const top = { opener: null } as unknown as Window & { parent: Window }
    top.parent = top

    expect(getLivePreviewHost(framed)).toBe(parent)
    expect(getLivePreviewHost(popup)).toBe(opener)
    expect(getLivePreviewHost(top)).toBeNull()
  })
})
