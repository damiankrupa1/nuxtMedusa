import type { APIRequestContext, APIResponse } from '@playwright/test'
import type { z } from 'zod'

import {
  MEDUSA_REGION_FIELDS,
  medusaRegionListResponseSchema,
} from '~/types/country'
import {
  medusaCustomerResponseSchema,
  medusaTokenRefreshSchema,
  medusaTokenSchema,
} from '~/types/customer'
import {
  medusaBackendUrl,
  medusaPublishableKey,
} from '~~/tests/e2e/support/env'
import { expect, test } from '~~/tests/e2e/support/fixtures'

// The contract behind the narrow response schemas (#84): the real Medusa's
// answers, asked directly (not through the storefront, which would answer a
// mismatch with an error of its own), must match them. A backend upgrade that
// renames or retypes a field the storefront reads turns this red. The
// schemas are loose, so a field Medusa adds never does.

const headers = (token?: string) => ({
  'x-publishable-api-key': medusaPublishableKey,
  ...(token ? { authorization: `Bearer ${token}` } : {}),
})

// The issues only (paths and codes), so a failure names the field and never
// prints a token or the customer
const issuesOf = (schema: z.ZodType, body: unknown) =>
  schema.safeParse(body).error?.issues.map(({ path, code }) => ({
    path: path.join('.'),
    code,
  })) ?? []

async function json(response: APIResponse) {
  expect(response.status()).toBe(200)
  return response.json()
}

const post = (
  request: APIRequestContext,
  path: string,
  data: unknown,
  token?: string,
) =>
  request.post(`${medusaBackendUrl}${path}`, { data, headers: headers(token) })

test.describe(
  'Medusa answers the storefront relies on',
  { tag: '@medusa' },
  () => {
    test('the regions answer matches its schema', async ({ request }) => {
      const body = await json(
        await request.get(`${medusaBackendUrl}/store/regions`, {
          params: { fields: MEDUSA_REGION_FIELDS },
          headers: headers(),
        }),
      )

      expect(issuesOf(medusaRegionListResponseSchema, body)).toEqual([])
      expect(body.regions.length).toBeGreaterThan(0)
    })

    test('registration, the token refresh, login and the customer match their schemas', async ({
      request,
    }) => {
      const email = `e2e-contract-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
      const password = 'e2e-password'

      // The calls server/repository/customer.repository.ts makes, in the order
      // the register and login routes make them
      const registered = await json(
        await post(request, '/auth/customer/emailpass/register', {
          email,
          password,
        }),
      )
      expect(issuesOf(medusaTokenSchema, registered.token)).toEqual([])

      const created = await json(
        await post(
          request,
          '/store/customers',
          { email, first_name: 'Contract', last_name: 'Check' },
          registered.token,
        ),
      )
      expect(issuesOf(medusaCustomerResponseSchema, created)).toEqual([])

      const refreshed = await json(
        await post(request, '/auth/token/refresh', {}, registered.token),
      )
      expect(issuesOf(medusaTokenRefreshSchema, refreshed)).toEqual([])

      const signedIn = await json(
        await post(request, '/auth/customer/emailpass', { email, password }),
      )
      expect(issuesOf(medusaTokenSchema, signedIn.token)).toEqual([])

      const me = await json(
        await request.get(`${medusaBackendUrl}/store/customers/me`, {
          headers: headers(signedIn.token),
        }),
      )
      expect(issuesOf(medusaCustomerResponseSchema, me)).toEqual([])

      const updated = await json(
        await post(
          request,
          '/store/customers/me',
          { first_name: 'Updated' },
          signedIn.token,
        ),
      )
      expect(issuesOf(medusaCustomerResponseSchema, updated)).toEqual([])
    })
  },
)
