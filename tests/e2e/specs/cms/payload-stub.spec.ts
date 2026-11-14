import { payloadStubUrl } from '~~/tests/e2e/support/env'
import { expect, test } from '~~/tests/e2e/support/fixtures'

// The stub must behave like the real Payload where it matters for the suite:
// no CORS headers. If someone "helpfully" added them, the browser could call it
// directly and the #42 regression (CMS content gone after a client-side
// navigation) could no longer be caught.
test.describe('Payload stub', () => {
  test('sends no CORS headers on a cross-origin read', async ({ request }) => {
    const response = await request.get(
      `${payloadStubUrl}/api/globals/navigation?locale=pl&depth=1`,
      { headers: { origin: 'http://storefront.example' } },
    )

    expect(response.status()).toBe(200)
    expect(response.headers()['access-control-allow-origin']).toBeUndefined()
    expect(
      response.headers()['access-control-allow-credentials'],
    ).toBeUndefined()
  })

  test('does not answer a preflight with CORS headers', async ({ request }) => {
    const response = await request.fetch(
      `${payloadStubUrl}/api/globals/navigation`,
      {
        method: 'OPTIONS',
        headers: {
          origin: 'http://storefront.example',
          'access-control-request-method': 'GET',
        },
      },
    )

    expect(response.headers()['access-control-allow-origin']).toBeUndefined()
    expect(response.headers()['access-control-allow-methods']).toBeUndefined()
  })

  test('answers 404 for an unknown global', async ({ request }) => {
    const response = await request.get(`${payloadStubUrl}/api/globals/nope`)

    expect(response.status()).toBe(404)
  })

  test('serves its image', async ({ request }) => {
    const response = await request.get(`${payloadStubUrl}/media/e2e-pixel.png`)

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toBe('image/png')
  })
})
