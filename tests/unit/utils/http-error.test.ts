import { describe, expect, it } from 'vitest'

import { getErrorStatus, isTooManyRequestsError } from '~/utils/http-error'

describe('getErrorStatus', () => {
  it.each([
    ['the Medusa SDK FetchError', { status: 401 }, 401],
    ['an h3 or ofetch error', { statusCode: 404 }, 404],
    ['an ofetch response', { response: { status: 502 } }, 502],
    ['status over statusCode', { status: 400, statusCode: 500 }, 400],
  ])('reads %s', (_, error, expected) => {
    expect(getErrorStatus(error)).toBe(expected)
  })

  it.each([
    ['null', null],
    ['a string', '429'],
    ['an error without a status', new Error('network')],
    ['a non-numeric status', { status: '429' }],
    ['NaN', { statusCode: Number.NaN }],
  ])('has no status for %s', (_, error) => {
    expect(getErrorStatus(error)).toBeUndefined()
  })
})

describe('isTooManyRequestsError', () => {
  it.each([
    { status: 429 },
    { statusCode: 429 },
    { response: { status: 429 } },
  ])('is true for a 429 (%o)', (error) => {
    expect(isTooManyRequestsError(error)).toBe(true)
  })

  it.each([{ statusCode: 401 }, { status: 503 }, new Error('network'), null])(
    'is false otherwise (%o)',
    (error) => {
      expect(isTooManyRequestsError(error)).toBe(false)
    },
  )
})
