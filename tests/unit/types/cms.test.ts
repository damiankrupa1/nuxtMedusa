import { describe, expect, it } from '@jest/globals'

import {
  cmsBrandsSchema,
  cmsCampaignSlidesSchema,
  cmsCategoryTilesSchema,
  cmsFooterContentSchema,
  cmsGlobalQuerySchema,
  cmsImageSchema,
  cmsJournalSectionSchema,
  cmsNavigationSchema,
  cmsShopTheLookSchema,
  cmsStudioStorySchema,
} from '~/types/cms'
import { payloadGlobals, payloadImage } from '~~/tests/fixtures/cms'

describe('cms global schemas', () => {
  it.each([
    ['navigation', cmsNavigationSchema],
    ['footer-content', cmsFooterContentSchema],
    ['studio-story', cmsStudioStorySchema],
    ['brands', cmsBrandsSchema],
    ['journal-section', cmsJournalSectionSchema],
    ['campaign-slides', cmsCampaignSlidesSchema],
    ['category-tiles', cmsCategoryTilesSchema],
    ['shop-the-look', cmsShopTheLookSchema],
  ] as const)('accept a complete %s global', (slug, schema) => {
    expect(schema.safeParse(payloadGlobals[slug]).success).toBe(true)
  })

  it.each([
    ['a missing headline', { headlineLine1: undefined }],
    ['a null paragraph', { paragraph1: null }],
    ['values that are not text', { values: [{ id: 'row', value: 'Wool' }] }],
    ['an image without a url', { image: { ...payloadImage, url: null } }],
  ])('reject a studio story with %s', (_case, change) => {
    const result = cmsStudioStorySchema.safeParse({
      ...payloadGlobals['studio-story'],
      ...change,
    })

    expect(result.success).toBe(false)
  })

  it('rejects a link row without a url anywhere in the footer', () => {
    const result = cmsFooterContentSchema.safeParse({
      ...payloadGlobals['footer-content'],
      legalLinks: [{ id: 'row', label: 'Terms', url: null }],
    })

    expect(result.success).toBe(false)
  })
})

describe('cmsImageSchema', () => {
  it.each([null, undefined, ''])(
    'reads the missing alt %p as a decorative image',
    (alt) => {
      expect(cmsImageSchema.parse({ url: payloadImage.url, alt })).toEqual({
        url: payloadImage.url,
        alt: '',
      })
    },
  )

  it('rejects an unpopulated upload (depth 0 gives a Media id)', () => {
    expect(cmsImageSchema.safeParse(payloadImage.id).success).toBe(false)
  })
})

describe('cmsFooterContentSchema optional contact/social', () => {
  const footer = payloadGlobals['footer-content']

  it('keeps the links when no contact details or handle are entered yet', () => {
    const result = cmsFooterContentSchema.parse({
      ...footer,
      contact: { email: null, phone: null, hours: null },
      social: { handle: '' },
    })

    expect(result.helpLinks).toEqual([{ label: 'Returns', url: '/returns' }])
    expect(result.contact).toBeNull()
    expect(result.social).toBeNull()
  })

  it('treats a missing group as no group', () => {
    const result = cmsFooterContentSchema.parse({
      ...footer,
      contact: undefined,
      social: null,
    })

    expect(result.contact).toBeNull()
    expect(result.social).toBeNull()
  })

  it('keeps the contact details that are entered and nulls the rest', () => {
    const result = cmsFooterContentSchema.parse({
      ...footer,
      contact: { email: 'hello@example.com', phone: '', hours: null },
    })

    expect(result.contact).toEqual({
      email: 'hello@example.com',
      phone: null,
      hours: null,
    })
  })
})

describe('cmsGlobalQuerySchema', () => {
  it('reads the locale and depth', () => {
    expect(cmsGlobalQuerySchema.parse({ locale: 'pl', depth: '1' })).toEqual({
      locale: 'pl',
      depth: 1,
    })
  })

  it('defaults a missing depth to 0, like the repository', () => {
    expect(cmsGlobalQuerySchema.parse({ locale: 'en' })).toEqual({
      locale: 'en',
      depth: 0,
    })
  })

  it.each([undefined, '', '../x', 'pl&depth=9', 'polish', ['pl', 'en']])(
    'rejects the locale %p',
    (locale) => {
      expect(cmsGlobalQuerySchema.safeParse({ locale }).success).toBe(false)
    },
  )

  it.each(['-1', '3', '1.5', 'abc', ['1', '2']])(
    'rejects the depth %p',
    (depth) => {
      expect(
        cmsGlobalQuerySchema.safeParse({ locale: 'pl', depth }).success,
      ).toBe(false)
    },
  )
})
