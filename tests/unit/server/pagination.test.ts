import { describe, expect, it, vi } from 'vitest'

import { listAllPages } from '~~/server/utils/pagination'

describe('listAllPages', () => {
  it('reads every page of a list endpoint', async () => {
    const all = Array.from({ length: 5 }, (_, index) => index)
    const fetchPage = vi.fn(
      async ({ limit, offset }: { limit: number; offset: number }) => ({
        items: all.slice(offset, offset + limit),
        count: all.length,
      }),
    )

    await expect(listAllPages(fetchPage, 2)).resolves.toEqual(all)
    expect(fetchPage.mock.calls.map(([params]) => params)).toEqual([
      { limit: 2, offset: 0 },
      { limit: 2, offset: 2 },
      { limit: 2, offset: 4 },
    ])
  })

  it('stops on an empty page even if the count says there is more', async () => {
    const fetchPage = vi.fn(async () => ({ items: [], count: 10 }))

    await expect(listAllPages(fetchPage)).resolves.toEqual([])
    expect(fetchPage).toHaveBeenCalledTimes(1)
  })

  it('passes a failed page on', async () => {
    const fetchPage = async () => {
      throw new Error('Medusa down')
    }

    await expect(listAllPages(fetchPage)).rejects.toThrow('Medusa down')
  })
})
