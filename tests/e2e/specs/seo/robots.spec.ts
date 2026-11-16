import { appUrl } from '~~/tests/e2e/support/env'
import { expect, test } from '~~/tests/e2e/support/fixtures'

// robots.txt is answered by the app itself (server/routes/robots.txt.ts), so
// these specs need no backend. The wording of the rules is covered by the unit
// tests of buildRobotsTxt(); here the point is the real server's response.
test.describe('robots.txt', () => {
  test('is cacheable plain text', async ({ request }) => {
    const response = await request.get('/robots.txt')

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('text/plain')
    expect(response.headers()['cache-control']).toBe('public, max-age=3600')
  })

  test('disallows the per-visitor pages of every country', async ({
    request,
  }) => {
    const body = await (await request.get('/robots.txt')).text()

    expect(body).toContain('User-agent: *')
    ;['cart', 'checkout', 'account', 'wishlist'].forEach((page) => {
      expect(body).toContain(`Disallow: /*/${page}$`)
      expect(body).toContain(`Disallow: /*/${page}?`)
    })
    expect(body).toContain('Disallow: /*/order/')
  })

  test('keeps the catalog crawlable', async ({ request }) => {
    const body = await (await request.get('/robots.txt')).text()

    const disallowed = body
      .split('\n')
      .filter((line) => line.startsWith('Disallow:'))
      .map((line) => line.slice('Disallow:'.length).trim())

    // A bare `Disallow: /` would hide the whole store
    expect(disallowed).not.toContain('/')
    expect(
      disallowed.filter((rule) =>
        /products|categories|collections|store/.test(rule),
      ),
    ).toEqual([])
  })

  test('points at the absolute sitemap URL', async ({ request }) => {
    const body = await (await request.get('/robots.txt')).text()

    expect(body).toContain(`Sitemap: ${appUrl}/sitemap.xml`)
  })
})
