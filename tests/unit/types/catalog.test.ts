import { describe, expect, it } from '@jest/globals'

import {
  catalogHandleParamsSchema,
  PRODUCT_LIST_MAX_LIMIT,
  productByHandleQuerySchema,
  productListQuerySchema,
} from '~/types/catalog'

describe('productListQuerySchema', () => {
  it('reads the whitelisted parameters and drops the rest, `fields` included', () => {
    expect(
      productListQuerySchema.parse({
        limit: '12',
        offset: '24',
        order: '-created_at',
        collection_id: 'pcol_1',
        category_id: ['pcat_1', 'pcat_2'],
        region_id: 'reg_1',
        fields: '*customer',
        sales_channel_id: 'sc_other',
      }),
    ).toEqual({
      limit: 12,
      offset: 24,
      order: '-created_at',
      collection_id: 'pcol_1',
      category_id: ['pcat_1', 'pcat_2'],
      region_id: 'reg_1',
    })
  })

  it('sorts by creation date when no order is given', () => {
    expect(productListQuerySchema.parse({})).toEqual({ order: 'created_at' })
  })

  it('clamps a page that is too large', () => {
    expect(productListQuerySchema.parse({ limit: '5000' }).limit).toBe(
      PRODUCT_LIST_MAX_LIMIT,
    )
  })

  it.each([
    ['limit', '0'],
    ['limit', '1.5'],
    ['limit', 'all'],
    ['offset', '-1'],
    ['order', 'price_asc'],
    ['order', 'metadata'],
    ['region_id', ''],
    ['region_id', ['reg_1', 'reg_2']],
    ['category_id', []],
  ])('rejects %s=%p', (key, value) => {
    expect(productListQuerySchema.safeParse({ [key]: value }).success).toBe(
      false,
    )
  })
})

describe('productByHandleQuerySchema', () => {
  it('keeps the region and drops everything else', () => {
    expect(
      productByHandleQuerySchema.parse({ region_id: 'reg_1', handle: 'other' }),
    ).toEqual({ region_id: 'reg_1' })
  })
})

describe('catalogHandleParamsSchema', () => {
  it('reads the handle', () => {
    expect(catalogHandleParamsSchema.parse({ handle: 'wool-coat' })).toEqual({
      handle: 'wool-coat',
    })
  })

  it.each([undefined, '', '   ', 'x'.repeat(256)])(
    'rejects the handle %p',
    (handle) => {
      expect(catalogHandleParamsSchema.safeParse({ handle }).success).toBe(
        false,
      )
    },
  )
})
