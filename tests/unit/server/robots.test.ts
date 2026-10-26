import { describe, expect, it } from '@jest/globals'

import { buildRobotsTxt } from '~~/server/utils/robots'

// Google's matching: `*` matches any characters, a trailing `$` anchors the
// end, every other rule is a prefix match against path + query
const isDisallowed = (robotsTxt: string, url: string) =>
  robotsTxt
    .split('\n')
    .filter((line) => line.startsWith('Disallow: '))
    .map((line) => line.slice('Disallow: '.length))
    .some((rule) => {
      const anchored = rule.endsWith('$')
      const pattern = (anchored ? rule.slice(0, -1) : rule)
        .split('*')
        .map((part) => part.replace(/[.?+^${}()|[\]\\]/g, '\\$&'))
        .join('.*')
      return new RegExp(`^${pattern}${anchored ? '$' : ''}`).test(url)
    })

describe('buildRobotsTxt', () => {
  const robotsTxt = buildRobotsTxt('https://shop.example.com/')

  it('points crawlers to the sitemap', () => {
    expect(robotsTxt).toContain('Sitemap: https://shop.example.com/sitemap.xml')
  })

  it.each([
    '/pl/cart',
    '/de/checkout',
    '/de/checkout?step=delivery',
    '/pl/account',
    '/pl/order/order_123/confirmed',
  ])('keeps crawlers out of %s', (url) => {
    expect(isDisallowed(robotsTxt, url)).toBe(true)
  })

  it.each([
    '/pl',
    '/pl/store',
    '/pl/products/cartoon-tee',
    '/pl/categories/accounting-gifts',
    '/pl/collections/summer?page=2',
  ])('lets crawlers into %s', (url) => {
    expect(isDisallowed(robotsTxt, url)).toBe(false)
  })
})
