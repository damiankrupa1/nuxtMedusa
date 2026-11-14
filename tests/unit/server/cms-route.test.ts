// @vitest-environment node
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { EventHandler, H3Event } from 'h3'
import { createError, isError } from 'h3'

import { payloadRepository } from '~~/server/repository/payload.repository'

vi.mock('~~/server/repository/payload.repository')

const getRouterParam = vi.fn()
const getQuery = vi.fn()
const useRuntimeConfig = vi.fn()
const fetchGlobal = vi.fn()
const event = {} as H3Event

Object.assign(globalThis, {
  createError,
  defineCachedEventHandler: (handler: unknown) => handler,
  getRouterParam,
  getQuery,
  useRuntimeConfig,
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
  fetchGlobal.mockResolvedValue({ primaryNav: [] })
  vi.mocked(payloadRepository).mockReturnValue({ fetchGlobal })
})

const rejection = async () => {
  try {
    await handler(event)
  } catch (thrown) {
    return thrown
  }
  throw new Error('Expected the handler to throw')
}

describe('GET /api/cms/:slug', () => {
  it('answers 404 for an unknown slug without calling Payload', async () => {
    getRouterParam.mockReturnValue('secrets')

    await expect(rejection()).resolves.toMatchObject({ statusCode: 404 })
    expect(payloadRepository).not.toHaveBeenCalled()
  })

  it('answers 503 when Payload is not configured', async () => {
    useRuntimeConfig.mockReturnValue({ public: { payloadUrl: '' } })

    await expect(rejection()).resolves.toMatchObject({ statusCode: 503 })
    expect(payloadRepository).not.toHaveBeenCalled()
  })

  it('answers 400 with the issues for an invalid query without calling Payload', async () => {
    getQuery.mockReturnValue({ locale: 'en', depth: '99' })

    const error = await rejection()

    expect(isError(error)).toBe(true)
    expect(error).toMatchObject({ statusCode: 400 })
    expect((error as { data?: unknown }).data).toBeDefined()
    expect(fetchGlobal).not.toHaveBeenCalled()
  })

  it('passes the Payload URL, slug and parsed query to the repository', async () => {
    await handler(event)

    expect(payloadRepository).toHaveBeenCalledWith('https://cms.example.com/')
    expect(fetchGlobal).toHaveBeenCalledWith('navigation', {
      locale: 'en',
      depth: 1,
    })
  })

  it('returns what the repository returns', async () => {
    await expect(handler(event)).resolves.toEqual({ primaryNav: [] })
  })

  it('lets the repository 502 through unchanged', async () => {
    const upstream = createError({
      statusCode: 502,
      message: 'Payload CMS request failed (404)',
    })
    fetchGlobal.mockRejectedValue(upstream)

    await expect(rejection()).resolves.toBe(upstream)
  })
})
