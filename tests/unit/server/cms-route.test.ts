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
import type { EventHandler, H3Event } from 'h3'
import { createError } from 'h3'

const getRouterParam = vi.fn()
const getQuery = vi.fn()
const useRuntimeConfig = vi.fn()
const fetchPayload = vi.fn()
const event = {} as H3Event

Object.assign(globalThis, {
  createError,
  defineCachedEventHandler: (handler: unknown) => handler,
  getRouterParam,
  getQuery,
  useRuntimeConfig,
  $fetch: fetchPayload,
})

let handler: EventHandler

beforeAll(async () => {
  handler = (await import('~~/server/api/cms/[slug].get')).default
})

beforeEach(() => {
  vi.clearAllMocks()
  getRouterParam.mockReturnValue('navigation')
  getQuery.mockReturnValue({ locale: 'en', depth: '1' })
  useRuntimeConfig.mockReturnValue({
    public: { payloadUrl: 'https://cms.example.com/' },
  })
  fetchPayload.mockResolvedValue({ primaryNav: [] })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('GET /api/cms/:slug', () => {
  it('removes a trailing slash from the Payload URL', async () => {
    await expect(handler(event)).resolves.toEqual({ primaryNav: [] })
    expect(fetchPayload).toHaveBeenCalledWith(
      'https://cms.example.com/api/globals/navigation',
      expect.objectContaining({
        query: { locale: 'en', depth: 1 },
        signal: expect.any(AbortSignal),
      }),
    )
  })

  it('maps an upstream timeout to the existing 502 response', async () => {
    const timeoutError = new DOMException(
      'The operation timed out',
      'TimeoutError',
    )
    const timeoutSignal = AbortSignal.abort(timeoutError)
    const timeout = vi
      .spyOn(AbortSignal, 'timeout')
      .mockReturnValue(timeoutSignal)

    fetchPayload.mockImplementation((_url, { signal }) =>
      signal.aborted
        ? Promise.reject(signal.reason)
        : Promise.resolve({ primaryNav: [] }),
    )

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 502,
      message: 'Payload CMS request failed (no response)',
    })
    expect(timeout).toHaveBeenCalledWith(5_000)
    expect(fetchPayload).toHaveBeenCalledWith(
      'https://cms.example.com/api/globals/navigation',
      expect.objectContaining({ signal: timeoutSignal }),
    )
  })

  it('keeps upstream 404 responses mapped to 502', async () => {
    fetchPayload.mockRejectedValue(
      Object.assign(new Error('Global not found'), { statusCode: 404 }),
    )

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 502,
      message: 'Payload CMS request failed (404)',
    })
  })
})
