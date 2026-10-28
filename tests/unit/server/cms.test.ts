import { describe, expect, it } from '@jest/globals'

import { CMS_GLOBAL_SLUGS } from '~/types/cms'
import { isCmsGlobalSlug, parseCmsGlobalQuery } from '~~/server/utils/cms'

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

describe('parseCmsGlobalQuery', () => {
  it('reads the locale and depth', () => {
    expect(parseCmsGlobalQuery({ locale: 'pl', depth: '1' })).toEqual({
      locale: 'pl',
      depth: 1,
    })
  })

  it('defaults a missing depth to 0, like the repository', () => {
    expect(parseCmsGlobalQuery({ locale: 'en' })).toEqual({
      locale: 'en',
      depth: 0,
    })
  })

  it.each([undefined, '', '../x', 'pl&depth=9', 'polish', ['pl', 'en']])(
    'rejects the locale %p',
    (locale) => {
      expect(parseCmsGlobalQuery({ locale })).toBeNull()
    },
  )

  it.each(['-1', '3', '1.5', 'abc'])('rejects the depth %p', (depth) => {
    expect(parseCmsGlobalQuery({ locale: 'pl', depth })).toBeNull()
  })
})
