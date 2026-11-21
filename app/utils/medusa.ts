import type { Config } from '@medusajs/js-sdk'
import type { MedusaPublicConfig } from '~/types/medusa'

// The config of the page's Medusa client (app/plugins/medusa.ts), in the
// browser and in the server render of a page. It is exactly what
// @nuxtjs/medusa 1.2.0 passed to `new Medusa()` with this project's settings
// (its `auth` defaults, `debug: false`), kept as it was on purpose: `auth.type`
// decides the fetch credentials mode (`include` for 'session'), so changing it
// changes CORS and cookies against the backend, which can't be checked
// without a real Medusa. This client never authenticates as the customer
// (see server/utils/session-cookie.ts), so the auth settings only matter for
// that credentials mode; the server API routes use their own client
// (server/utils/medusa.ts).
export function buildBrowserMedusaConfig({
  backendUrl,
  publishableKey,
}: MedusaPublicConfig): Config {
  return {
    baseUrl: backendUrl,
    publishableKey,
    debug: false,
    auth: {
      type: 'session',
      jwtTokenStorageKey: 'medusa_auth_token',
      jwtTokenStorageMethod: 'local',
    },
  }
}
