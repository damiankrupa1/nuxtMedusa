import { beforeEach, describe, expect, it, vi } from 'vitest'

import { countryRepository } from '~/repository/country.repository'
import { medusaRegionListResponse } from '~~/tests/fixtures/medusa'

describe('countryRepository().listCountries', () => {
  const fetchMock = vi.fn<(...args: unknown[]) => Promise<unknown>>()
  const captureError = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(globalThis, { $fetch: fetchMock, captureError })
  })

  it('returns the regions of /api/regions', async () => {
    fetchMock.mockResolvedValue(medusaRegionListResponse)

    await expect(countryRepository().listCountries()).resolves.toBe(
      medusaRegionListResponse,
    )
    expect(fetchMock).toHaveBeenCalledWith('/api/regions')
    expect(captureError).not.toHaveBeenCalled()
  })

  // The server reported every answer of /api/regions already: a Medusa
  // failure, an invalid regions answer (#84), any other 5xx
  it.each([502, 500, 503])(
    'rethrows an answer with status %d without reporting it again',
    async (statusCode) => {
      const error = Object.assign(new Error('regions failed'), { statusCode })
      fetchMock.mockRejectedValue(error)

      await expect(countryRepository().listCountries()).rejects.toBe(error)
      expect(captureError).not.toHaveBeenCalled()
    },
  )

  it('reports a request that got no answer, which the server never saw', async () => {
    const error = new TypeError('fetch failed')
    fetchMock.mockRejectedValue(error)

    await expect(countryRepository().listCountries()).rejects.toBe(error)
    expect(captureError).toHaveBeenCalledTimes(1)
    expect(captureError).toHaveBeenCalledWith(error, { source: 'medusa' })
  })
})
