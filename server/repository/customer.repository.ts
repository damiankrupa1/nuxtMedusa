import type Medusa from '@medusajs/js-sdk'
import type { StoreCustomerResponse } from '@medusajs/types'
import type {
  LoginCustomerData,
  RegisterCustomerData,
  UpdateCustomerData,
} from '~/types/customer'

const bearer = (token: string) => ({
  Authorization: `Bearer ${token}`,
})

// Medusa's emailpass routes for the `customer` actor, the same ones the SDK's
// auth.login()/auth.register() call
const EMAILPASS_PATH = '/auth/customer/emailpass'

// The token of a plain `{ token }` answer. Medusa also answers a login with a
// redirect (`location`, third-party auth), an MFA challenge or a
// verification step, partly with a token of their own; none of them is a
// session for this store, so they are an unexpected answer (a 500 through
// the handler wrapper), as is an answer without a token.
const sessionToken = (answer: unknown, message: string): string => {
  const { token, location, mfa_challenge, verification_required } =
    typeof answer === 'object' && answer !== null
      ? (answer as Record<string, unknown>)
      : {}

  if (
    typeof token !== 'string' ||
    token === '' ||
    location ||
    mfa_challenge ||
    verification_required
  ) {
    throw new Error(message)
  }

  return token
}

// The only place on the server that knows Medusa's customer and auth calls
// (`emailpass` for the `customer` actor, the bearer header). The handlers in
// server/api/customers/** keep the HTTP side: the parsed body, the
// `medusa_jwt` cookie and the statuses.
//
// It takes the request's own client (`serverMedusaClient(event)`), never one
// shared at module level: depending on its `auth` config the SDK keeps a
// login's token on the client (today's config on the server doesn't), and a
// shared client would then carry one shopper's session into another's
// request. So every call that acts as a customer gets that customer's token
// as an argument and sends it as `Authorization: Bearer <token>` itself.
//
// Login and register call Medusa's token routes through `medusa.client.fetch`,
// not the SDK's auth.login()/auth.register() (#82). The server client has the
// @nuxtjs/medusa defaults, `auth: { type: 'session', jwtTokenStorageMethod:
// 'local' }`, shared with the browser client. With them auth.login() follows
// the token with `POST /auth/session`, which opens a Medusa cookie session
// that this server never uses and nothing ever ends, and auth.register()
// stores the token in localStorage without awaiting it, which on the server
// rejects unhandled ("Local JWT storage is only available in the browser").
// The store keeps only the JWT, in its own `medusa_jwt` cookie.
//
// Medusa errors are not caught or reported here: they reach
// defineWrappedResponseHandler(), which reports them once (source
// `server-api`) and keeps their status and message, as it did before this
// repository existed.
export function customerRepository(medusa: Medusa) {
  return {
    // Returns the session token
    async login({ email, password }: LoginCustomerData): Promise<string> {
      const answer = await medusa.client.fetch<unknown>(EMAILPASS_PATH, {
        method: 'POST',
        body: { email, password },
      })

      return sessionToken(answer, 'Unexpected login response from Medusa')
    },

    // Creates the auth identity only and returns its token; the customer
    // itself is created with createCustomer() and that token.
    async register({
      email,
      password,
    }: Pick<RegisterCustomerData, 'email' | 'password'>): Promise<string> {
      const answer = await medusa.client.fetch<unknown>(
        `${EMAILPASS_PATH}/register`,
        { method: 'POST', body: { email, password } },
      )

      return sessionToken(
        answer,
        'Unexpected registration response from Medusa',
      )
    },

    // The registration token belongs to the auth identity alone (an empty
    // `actor_id`), so Medusa refuses it for `/store/customers/me`. Once the
    // customer exists, Medusa's refresh route issues a token for that
    // customer, which is the session. The SDK's auth.refresh() would store it
    // on the client like auth.register() does, so this asks the route too.
    async refreshToken(token: string): Promise<string> {
      const answer = await medusa.client.fetch<unknown>('/auth/token/refresh', {
        method: 'POST',
        headers: bearer(token),
      })

      return sessionToken(
        answer,
        'Unexpected token refresh response from Medusa',
      )
    },

    async createCustomer(
      token: string,
      {
        email,
        first_name,
        last_name,
        phone,
      }: Omit<RegisterCustomerData, 'password'>,
    ): Promise<StoreCustomerResponse> {
      return await medusa.store.customer.create(
        { email, first_name, last_name, phone },
        {},
        bearer(token),
      )
    },

    // Rejects like any other call when Medusa refuses the token (a 401);
    // GET /api/customers/me turns that into `{ customer: null }`, login keeps
    // it as an error. Without a session there is no token and no call: GET me
    // answers `{ customer: null }` itself.
    async retrieveCustomer(token: string): Promise<StoreCustomerResponse> {
      return await medusa.store.customer.retrieve({}, bearer(token))
    },

    async updateCustomer(
      token: string,
      data: UpdateCustomerData,
    ): Promise<StoreCustomerResponse> {
      return await medusa.store.customer.update(data, {}, bearer(token))
    },
  }
}
