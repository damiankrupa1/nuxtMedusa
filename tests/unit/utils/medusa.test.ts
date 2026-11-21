import { describe, expect, it } from 'vitest'

import { buildBrowserMedusaConfig } from '~/utils/medusa'

// #89 replaced @nuxtjs/medusa 1.2.0 with app/plugins/medusa.ts. The page's
// client must get exactly the config the module gave it: its `auth.type`
// decides the fetch credentials mode, so a change there changes CORS and
// cookies against the backend.
describe('buildBrowserMedusaConfig', () => {
  it('is what @nuxtjs/medusa 1.2.0 passed to new Medusa() with its defaults', () => {
    expect(
      buildBrowserMedusaConfig({
        backendUrl: 'https://medusa.example.com',
        publishableKey: 'pk_test',
      }),
    ).toEqual({
      baseUrl: 'https://medusa.example.com',
      publishableKey: 'pk_test',
      debug: false,
      auth: {
        type: 'session',
        jwtTokenStorageKey: 'medusa_auth_token',
        jwtTokenStorageMethod: 'local',
      },
    })
  })

  it('keeps an empty publishable key empty (the SDK then sends no key header)', () => {
    expect(
      buildBrowserMedusaConfig({
        backendUrl: 'http://localhost:9000',
        publishableKey: '',
      }),
    ).toMatchObject({ baseUrl: 'http://localhost:9000', publishableKey: '' })
  })
})
