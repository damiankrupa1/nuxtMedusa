import { payloadStubUrl } from '~~/tests/e2e/support/env'
import { expect, test } from '~~/tests/e2e/support/fixtures'
import { trackPayloadRequests } from '~~/tests/e2e/support/network-guard'

// Tests the guard the home page regression spec (#42) relies on, against a
// page that is not the storefront: a blank document served for a made-up
// origin, which then calls the Payload stub the way a buggy component would.
const pageOrigin = 'http://storefront.e2e.test'

test.describe('network guard', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(`${pageOrigin}/**`, (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: '<!doctype html><title>blank</title>',
      }),
    )
  })

  test('flags a browser call to Payload that CORS blocks', async ({ page }) => {
    const payload = trackPayloadRequests(page)
    await page.goto(pageOrigin)

    const outcome = await page.evaluate(
      (url) =>
        fetch(url).then(
          () => 'allowed',
          () => 'blocked',
        ),
      `${payloadStubUrl}/api/globals/navigation?locale=pl&depth=1`,
    )

    expect(outcome).toBe('blocked')
    expect(payload.requests()).toHaveLength(1)
    await expect.poll(() => payload.failures().length).toBe(1)
  })

  test('stays clean for calls to the page’s own origin', async ({ page }) => {
    const payload = trackPayloadRequests(page)
    await page.route(`${pageOrigin}/api/cms/navigation`, (route) =>
      route.fulfill({ json: { primaryNav: [] } }),
    )
    await page.goto(pageOrigin)

    await page.evaluate(() => fetch('/api/cms/navigation'))

    expect(payload.requests()).toEqual([])
    expect(payload.failures()).toEqual([])
  })

  test('ignores images from the Payload host', async ({ page }) => {
    const payload = trackPayloadRequests(page)
    await page.goto(pageOrigin)

    await page.evaluate(
      (url) =>
        new Promise<void>((resolve) => {
          const image = new Image()
          image.onload = () => resolve()
          image.onerror = () => resolve()
          image.src = url
        }),
      `${payloadStubUrl}/media/e2e-pixel.png`,
    )

    expect(payload.requests()).toEqual([])
  })
})
