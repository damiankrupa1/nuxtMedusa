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

  it('does not report failures itself', async () => {
    fetchPayload.mockRejectedValue(
      Object.assign(new Error('upstream'), { statusCode: 500 }),
    )

    await expect(
      payloadRepository('https://cms.example.com').fetchGlobal(
        'navigation',
        query,
      ),
    ).rejects.toBeDefined()
    expect(Sentry.captureException).not.toHaveBeenCalled()
    expect(Sentry.addBreadcrumb).not.toHaveBeenCalled()
  })
})
