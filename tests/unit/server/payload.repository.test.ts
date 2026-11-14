// @vitest-environment node
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { createError } from 'h3'

import * as Sentry from '@sentry/nuxt'
import {
  PAYLOAD_REQUEST_TIMEOUT_MS,
  payloadRepository,
} from '~~/server/repository/payload.repository'

const fetchPayload = vi.fn()
const query = { locale: 'en', depth: 1 }

beforeAll(() => {
  Object.assign(globalThis, { createError, $fetch: fetchPayload })
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  vi.mocked(Sentry.isEnabled).mockReturnValue(true)
  fetchPayload.mockResolvedValue({ primaryNav: [] })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('payloadRepository().fetchGlobal', () => {
  it('returns the response body unchanged and requests the global with query and signal', async () => {
    const body = { primaryNav: [{ id: 1 }], extra: 'kept' }
    fetchPayload.mockResolvedValue(body)

    const result = await payloadRepository(
      'https://cms.example.com',
    ).fetchGlobal('navigation', query)

    expect(result).toBe(body)
    expect(fetchPayload).toHaveBeenCalledWith(
      'https://cms.example.com/api/globals/navigation',
      expect.objectContaining({ query, signal: expect.any(AbortSignal) }),
    )
  })

  it.each(['https://cms.example.com/', 'https://cms.example.com///'])(
    'removes trailing slashes from the base URL (%s)',
    async (baseUrl) => {
      await payloadRepository(baseUrl).fetchGlobal('navigation', query)

      expect(fetchPayload).toHaveBeenCalledWith(
        'https://cms.example.com/api/globals/navigation',
        expect.anything(),
      )
    },
  )

  it.each([404, 500, 503])(
    'maps an upstream %i to a 502 naming the status',
    async (statusCode) => {
      fetchPayload.mockRejectedValue(
        Object.assign(new Error('upstream'), { statusCode }),
      )

      await expect(
        payloadRepository('https://cms.example.com').fetchGlobal(
          'navigation',
          query,
        ),
      ).rejects.toMatchObject({
        statusCode: 502,
        message: `Payload CMS request failed (${statusCode})`,
      })
    },
  )

  it('maps a network error without a status to a 502 with "no response"', async () => {
    fetchPayload.mockRejectedValue(new TypeError('fetch failed'))

    await expect(
      payloadRepository('https://cms.example.com').fetchGlobal('footer', query),
    ).rejects.toMatchObject({
      statusCode: 502,
      message: 'Payload CMS request failed (no response)',
    })
  })

  it('bounds the request with a timeout and maps it to a 502', async () => {
    const timeoutSignal = AbortSignal.abort(
      new DOMException('The operation timed out', 'TimeoutError'),
    )
    const timeout = vi
      .spyOn(AbortSignal, 'timeout')
      .mockReturnValue(timeoutSignal)
    fetchPayload.mockImplementation((_url, { signal }) =>
      signal.aborted ? Promise.reject(signal.reason) : Promise.resolve({}),
    )

    await expect(
      payloadRepository('https://cms.example.com').fetchGlobal(
        'navigation',
        query,
      ),
    ).rejects.toMatchObject({
      statusCode: 502,
      message: 'Payload CMS request failed (no response)',
    })
    expect(timeout).toHaveBeenCalledWith(PAYLOAD_REQUEST_TIMEOUT_MS)
    expect(PAYLOAD_REQUEST_TIMEOUT_MS).toBe(5_000)
    expect(fetchPayload).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: timeoutSignal }),
    )
  })

  describe('reporting a failure', () => {
    const fetchNavigation = () =>
      payloadRepository('https://cms.example.com').fetchGlobal(
        'navigation',
        query,
      )

    const failWith = async (upstream: unknown) => {
      fetchPayload.mockRejectedValue(upstream)
      try {
        await fetchNavigation()
      } catch (thrown) {
        return thrown as Error
      }
      throw new Error('Expected fetchGlobal() to throw')
    }

    it('reports once with source and global, and links the reported error as the cause of the 502', async () => {
      const upstream = Object.assign(new Error('upstream'), {
        statusCode: 500,
      })

      const error = await failWith(upstream)

      expect(Sentry.captureException).toHaveBeenCalledTimes(1)
      const [reported, options] = vi.mocked(Sentry.captureException).mock
        .calls[0] as [Error, unknown]
      // The same object: captureError() marks it as captured, and Sentry's
      // Nitro error hook skips an H3 error whose cause carries that mark
      expect(error.cause).toBe(reported)
      expect(reported.message).toBe('Payload CMS request failed (500)')
      expect(reported.cause).toBe(upstream)
      expect(error).toMatchObject({
        statusCode: 502,
        message: 'Payload CMS request failed (500)',
      })
      expect(options).toEqual({
        tags: { source: 'payload', cms_global: 'navigation' },
        extra: {},
      })
    })

    it('reports an upstream 404 as an event, not as a breadcrumb: a missing global is ours to fix', async () => {
      await failWith(Object.assign(new Error('Not Found'), { statusCode: 404 }))

      expect(Sentry.captureException).toHaveBeenCalledTimes(1)
      expect(Sentry.addBreadcrumb).not.toHaveBeenCalled()
    })

    it('reports a timeout', async () => {
      const timeoutSignal = AbortSignal.abort(
        new DOMException('The operation timed out', 'TimeoutError'),
      )
      vi.spyOn(AbortSignal, 'timeout').mockReturnValue(timeoutSignal)
      fetchPayload.mockImplementation((_url, { signal }) =>
        Promise.reject(signal.reason),
      )

      const error = await fetchNavigation().catch((thrown: Error) => thrown)

      expect(error).toMatchObject({
        statusCode: 502,
        message: 'Payload CMS request failed (no response)',
      })
      expect(Sentry.captureException).toHaveBeenCalledTimes(1)
      expect(vi.mocked(Sentry.captureException).mock.calls[0]?.[0]).toBe(
        (error as Error).cause,
      )
    })

    it('does not report a successful request', async () => {
      await fetchNavigation()

      expect(Sentry.captureException).not.toHaveBeenCalled()
      expect(Sentry.addBreadcrumb).not.toHaveBeenCalled()
    })
  })
})
