import { beforeEach, describe, expect, it, vi } from 'vitest'

import { previewRepository } from '~/repository/preview.repository'

describe('preview repository', () => {
  const fetchMock = vi.fn<(...args: unknown[]) => Promise<unknown>>()
  const captureError = vi.fn()
  const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl'

  Object.assign(globalThis, { $fetch: fetchMock, captureError })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('checks the token in a header of a POST, never in the URL', async () => {
    fetchMock.mockResolvedValue({ expiresAt: '2026-11-19T12:00:00.000Z' })

    const session = await previewRepository().fetchSession(token)

    expect(session).toEqual({ expiresAt: '2026-11-19T12:00:00.000Z' })
    expect(fetchMock).toHaveBeenCalledWith('/api/preview/session', {
      method: 'POST',
      headers: { 'x-preview-token': token },
      cache: 'no-store',
    })
  })

  it.each([401, 404, 500])(
    'answers null without reporting when the server answers %i (it reports its own failures)',
    async (statusCode) => {
      fetchMock.mockRejectedValue(
        Object.assign(new Error('failed'), { statusCode }),
      )

      expect(await previewRepository().fetchSession(token)).toBeNull()
      expect(captureError).not.toHaveBeenCalled()
    },
  )

  it('reports a request without an answer, without the token', async () => {
    fetchMock.mockRejectedValue(
      Object.assign(new TypeError('fetch failed'), {
        options: { headers: { 'x-preview-token': token } },
      }),
    )

    expect(await previewRepository().fetchSession(token)).toBeNull()

    expect(captureError).toHaveBeenCalledTimes(1)
    const [error, context] = captureError.mock.calls[0] as [Error, object]
    expect(context).toEqual({ source: 'preview' })
    expect(error.cause).toBeUndefined()
    expect(
      JSON.stringify([error.message, error.stack, { ...error }, context]),
    ).not.toContain(token)
  })
})
