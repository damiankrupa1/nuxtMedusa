/**
 * @jest-environment node
 */
import { describe, expect, it } from '@jest/globals'
import { createError } from 'h3'

import { CMS_GLOBAL_SLUGS } from '~/types/cms'
import { isCmsGlobalSlug, parseCmsGlobalQuery } from '~~/server/utils/cms'

// Nitro auto-imports it in server code
Object.assign(globalThis, { createError })

describe('isCmsGlobalSlug', () => {
  it.each(CMS_GLOBAL_SLUGS)('allows the %s global', (slug) => {
    expect(isCmsGlobalSlug(slug)).toBe(true)
  })

  it.each(['users', 'media', '../users', 'navigation/..', '', undefined])(
    'rejects %p, so the proxy only reaches storefront globals',
    (slug) => {
      expect(isCmsGlobalSlug(slug)).toBe(false)
    },
  )
})

// The accepted and rejected values themselves are covered by
// tests/unit/types/cms.test.ts (cmsGlobalQuerySchema)
describe('parseCmsGlobalQuery', () => {
  it('reads the locale and depth', () => {
    expect(parseCmsGlobalQuery({ locale: 'pl', depth: '1' })).toEqual({
      locale: 'pl',
      depth: 1,
    })
  })

  it('answers an invalid query with a 400 naming the bad parameters', () => {
    let error: unknown
    try {
      parseCmsGlobalQuery({ locale: '../x', depth: '9' })
    } catch (thrown) {
      error = thrown
    }

    expect(error).toMatchObject({
      statusCode: 400,
      message: 'Invalid request query',
      data: {
        fieldErrors: {
          locale: [expect.any(String)],
          depth: [expect.any(String)],
        },
      },
    })
  })
})
