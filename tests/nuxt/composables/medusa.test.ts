import { afterEach, describe, expect, it, vi } from 'vitest'
import Medusa from '@medusajs/js-sdk'
import { useNuxtApp, useRuntimeConfig } from 'nuxt/app'

import { useMedusaClient } from '~/composables/medusa'

// app/plugins/medusa.ts (#89, replacing @nuxtjs/medusa's plugin) runs in the
// Nuxt test app like in the real one: these tests use the client it provided.
describe('useMedusaClient in Nuxt', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("returns the app's Medusa client, the one the plugin provided as $medusa", () => {
    const client = useMedusaClient()

    expect(client).toBeInstanceOf(Medusa)
    expect(client).toBe(useNuxtApp().$medusa)
    expect(useMedusaClient()).toBe(client)
  })

  it('asks the backend of the runtime config with the session auth of the page client', async () => {
    const network = vi.fn(async () => Response.json({ regions: [] }))
    vi.stubGlobal('fetch', network)
    const { backendUrl } = useRuntimeConfig().public.medusa

    await useMedusaClient().store.region.list()

    const [input, init] = network.mock.calls[0] as unknown as [URL, RequestInit]
    expect(String(input)).toBe(`${backendUrl.replace(/\/$/, '')}/store/regions`)
    // `auth.type: 'session'`, as with the module: cookies are sent to the
    // backend and no token header is
    expect(init.credentials).toBe('include')
    expect(new Headers(init.headers).has('authorization')).toBe(false)
  })
})
