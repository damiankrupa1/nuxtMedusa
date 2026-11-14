// @vitest-environment node
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { EventHandler, H3Event } from 'h3'
import { createError } from 'h3'

import { medusaRepository } from '~~/server/repository/medusa.repository'

vi.mock('~~/server/repository/medusa.repository')

const listRegions = vi.fn()
const listSitemapCatalog = vi.fn()
const $fetch = vi.fn()
const cacheOptions: Record<string, unknown>[] = []
const event = { $fetch } as unknown as H3Event

Object.assign(globalThis, {
  createError,
  defineCachedEventHandler: (
    handler: unknown,
    options: Record<string, unknown>,
  ) => {
    cacheOptions.push(options)
    return handler
  },
})

let regionsHandler: EventHandler
let sitemapHandler: EventHandler

beforeAll(async () => {
  regionsHandler = (await import('~~/server/api/regions/index.get')).default
  sitemapHandler = (await import('~~/server/api/__sitemap__/urls.get')).default
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(medusaRepository).mockReturnValue({
    listRegions,
    listSitemapCatalog,
  })
})

describe('GET /api/regions', () => {
  it('returns what the repository returns for the event', async () => {
    const body = { regions: [{ id: 'reg_1' }] }
    listRegions.mockResolvedValue(body)

    await expect(regionsHandler(event)).resolves.toBe(body)
    expect(medusaRepository).toHaveBeenCalledWith(event)
  })

  it('lets the repository error through unchanged', async () => {
    const upstream = createError({ statusCode: 503, message: 'down' })
    listRegions.mockRejectedValue(upstream)

    await expect(regionsHandler(event)).rejects.toBe(upstream)
  })

  it('stays cached for 10 minutes with stale-while-revalidate', () => {
    expect(cacheOptions).toContainEqual({
      name: 'regions',
      maxAge: 600,
      staleMaxAge: 3600,
      swr: true,
    })
  })
})

describe('sitemap source', () => {
  const regions = [
    {
      countries: [
        { iso_2: 'pl', name: 'Poland' },
        { iso_2: 'de', name: 'Germany' },
      ],
    },
  ]

  it('builds the catalog URLs of every country from the regions and the repository catalog', async () => {
    $fetch.mockResolvedValue({ regions })
    listSitemapCatalog.mockResolvedValue({
      products: [{ handle: 'shorts' }],
      categories: [{ handle: 'pants' }],
      collections: [{ handle: 'summer' }],
    })

    const urls = (await sitemapHandler(event)) as { loc: string }[]

    expect($fetch).toHaveBeenCalledWith('/api/regions')
    expect(urls.map(({ loc }) => loc)).toEqual(
      expect.arrayContaining([
        '/pl',
        '/de/store',
        '/pl/products/shorts',
        '/de/categories/pants',
        '/pl/collections/summer',
      ]),
    )
  })

  it('lets a repository failure through, so it is not cached', async () => {
    const upstream = createError({ statusCode: 500, message: 'boom' })
    $fetch.mockResolvedValue({ regions })
    listSitemapCatalog.mockRejectedValue(upstream)

    await expect(sitemapHandler(event)).rejects.toBe(upstream)
  })

  it('stays cached for 10 minutes with stale-while-revalidate', () => {
    expect(cacheOptions).toContainEqual({
      name: 'sitemap-urls',
      maxAge: 600,
      staleMaxAge: 3600,
      swr: true,
    })
  })
})
