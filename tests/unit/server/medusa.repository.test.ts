// @vitest-environment node
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type Medusa from '@medusajs/js-sdk'
import type { H3Event } from 'h3'
import { createError } from 'h3'

import * as Sentry from '@sentry/nuxt'
import { medusaRepository } from '~~/server/repository/medusa.repository'
import { resetReportedOnce } from '~/utils/report-once'
import { serverMedusaClient } from '~~/server/utils/medusa'
import { medusaRegionListResponse } from '~~/tests/fixtures/medusa'

vi.mock('~~/server/utils/medusa', () => ({ serverMedusaClient: vi.fn() }))

const event = {} as H3Event

const medusa = {
  store: {
    region: { list: vi.fn() },
    product: { list: vi.fn() },
    category: { list: vi.fn() },
    collection: { list: vi.fn() },
  },
}

beforeAll(() => {
  Object.assign(globalThis, { createError })
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  vi.mocked(Sentry.isEnabled).mockReturnValue(true)
  vi.mocked(serverMedusaClient).mockReturnValue(medusa as unknown as Medusa)
  medusa.store.region.list.mockResolvedValue({ regions: [] })
  medusa.store.product.list.mockResolvedValue({ products: [], count: 0 })
  medusa.store.category.list.mockResolvedValue({
    product_categories: [],
    count: 0,
  })
  medusa.store.collection.list.mockResolvedValue({
    collections: [],
    count: 0,
  })
})

const failure = async (promise: Promise<unknown>) => {
  try {
    await promise
  } catch (thrown) {
    return thrown as Error
  }
  throw new Error('Expected the repository to throw')
}

describe('medusaRepository().listRegions', () => {
  it('asks the client of the event for the regions with the fields the app needs', async () => {
    const body = { regions: [{ id: 'reg_1' }] }
    medusa.store.region.list.mockResolvedValue(body)

    await expect(medusaRepository(event).listRegions()).resolves.toBe(body)

    expect(serverMedusaClient).toHaveBeenCalledWith(event)
    expect(medusa.store.region.list).toHaveBeenCalledWith({
      fields:
        'id,countries.iso_2,countries.name,countries.display_name,countries.region_id',
    })
    expect(Sentry.captureException).not.toHaveBeenCalled()
  })

  it('reports a Medusa failure once and throws an H3 error with its status and the reported error as cause', async () => {
    const upstream = Object.assign(new Error('Region service down'), {
      status: 503,
    })
    medusa.store.region.list.mockRejectedValue(upstream)

    const error = await failure(medusaRepository(event).listRegions())

    expect(error).toMatchObject({
      statusCode: 503,
      message: 'Region service down',
    })
    expect(error.cause).toBe(upstream)
    expect(Sentry.captureException).toHaveBeenCalledTimes(1)
    expect(vi.mocked(Sentry.captureException).mock.calls[0]).toEqual([
      upstream,
      { tags: { source: 'medusa' }, extra: {} },
    ])
  })

  it('falls back to a 500 when the error has no status or message', async () => {
    medusa.store.region.list.mockRejectedValue({})

    await expect(
      failure(medusaRepository(event).listRegions()),
    ).resolves.toMatchObject({
      statusCode: 500,
      message: 'Internal Server Error',
    })
  })

  it("returns Medusa's recorded regions answer as it is", async () => {
    medusa.store.region.list.mockResolvedValue(medusaRegionListResponse)

    await expect(medusaRepository(event).listRegions()).resolves.toBe(
      medusaRegionListResponse,
    )
    expect(Sentry.captureException).not.toHaveBeenCalled()
  })

  // #84, the soft policy: reported once, then answered like a regions outage
  describe('with an answer that does not match its schema', () => {
    const [poland] = medusaRegionListResponse.regions
    const { region_id: _regionId, ...withoutRegionId } = poland!.countries[0]!
    const invalid = {
      regions: [{ ...poland, countries: [withoutRegionId] }],
    }

    beforeEach(() => {
      resetReportedOnce()
      medusa.store.region.list.mockResolvedValue(invalid)
    })

    it('reports it once as invalid_response, with the issues and never the answer', async () => {
      const error = await failure(medusaRepository(event).listRegions())

      expect(Sentry.captureException).toHaveBeenCalledTimes(1)
      const [reported, hint] =
        vi.mocked(Sentry.captureException).mock.calls[0] ?? []
      expect((reported as Error).message).toBe(
        'Unexpected regions response from Medusa',
      )
      expect(hint).toEqual({
        tags: { source: 'medusa', error_type: 'invalid_response' },
        extra: {
          response: 'regions',
          issues: [
            {
              code: 'invalid_type',
              path: 'regions.0.countries.0.region_id',
              message: 'Invalid input: expected string, received undefined',
            },
          ],
        },
      })
      expect(JSON.stringify(hint)).not.toContain(poland!.id)
      expect(error.cause).toBe(reported)
    })

    it('throws a 502, never an empty or partial list the cache would keep', async () => {
      await expect(
        failure(medusaRepository(event).listRegions()),
      ).resolves.toMatchObject({
        statusCode: 502,
        message: 'Unexpected regions response from Medusa',
      })
    })

    it('does not report a repeat, and throws it with the same reported cause', async () => {
      const first = await failure(medusaRepository(event).listRegions())
      const second = await failure(medusaRepository(event).listRegions())

      expect(Sentry.captureException).toHaveBeenCalledTimes(1)
      // Sentry marks the error it captured, and its Nitro hook skips an H3
      // error whose cause carries the mark: the same cause keeps the repeats
      // out of Sentry
      expect(second.cause).toBe(first.cause)
    })
  })

  it('keeps the status of a Medusa 4xx but leaves it as a breadcrumb, not an event', async () => {
    medusa.store.region.list.mockRejectedValue(
      Object.assign(new Error('Unauthorized'), { status: 401 }),
    )

    await expect(
      failure(medusaRepository(event).listRegions()),
    ).resolves.toMatchObject({ statusCode: 401 })
    expect(Sentry.captureException).not.toHaveBeenCalled()
    expect(Sentry.addBreadcrumb).toHaveBeenCalledTimes(1)
  })
})

describe('medusaRepository().listSitemapCatalog', () => {
  it('walks products, categories and collections page by page with only handle and updated_at', async () => {
    medusa.store.product.list
      .mockResolvedValueOnce({
        products: Array.from({ length: 100 }, (_, i) => ({ handle: `p${i}` })),
        count: 101,
      })
      .mockResolvedValueOnce({ products: [{ handle: 'p100' }], count: 101 })
    medusa.store.category.list.mockResolvedValue({
      product_categories: [{ handle: 'c1' }],
      count: 1,
    })
    medusa.store.collection.list.mockResolvedValue({
      collections: [{ handle: 'col1' }],
      count: 1,
    })

    const result = await medusaRepository(event).listSitemapCatalog()

    expect(result.products).toHaveLength(101)
    expect(result.categories).toEqual([{ handle: 'c1' }])
    expect(result.collections).toEqual([{ handle: 'col1' }])
    expect(medusa.store.product.list.mock.calls).toEqual([
      [{ fields: 'handle,updated_at', limit: 100, offset: 0 }],
      [{ fields: 'handle,updated_at', limit: 100, offset: 100 }],
    ])
    expect(medusa.store.category.list).toHaveBeenCalledWith({
      fields: 'handle,updated_at',
      limit: 100,
      offset: 0,
    })
    expect(medusa.store.collection.list).toHaveBeenCalledWith({
      fields: 'handle,updated_at',
      limit: 100,
      offset: 0,
    })
  })

  it('reports a failing list once and throws an H3 error with its status', async () => {
    const upstream = Object.assign(new Error('boom'), { status: 500 })
    medusa.store.category.list.mockRejectedValue(upstream)

    const error = await failure(medusaRepository(event).listSitemapCatalog())

    expect(error).toMatchObject({ statusCode: 500, message: 'boom' })
    expect(error.cause).toBe(upstream)
    expect(Sentry.captureException).toHaveBeenCalledTimes(1)
  })
})
