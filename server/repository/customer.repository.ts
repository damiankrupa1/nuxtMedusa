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

// The actor and provider of the store's customers, for the SDK's
// auth.login()/auth.register() (`POST /auth/customer/emailpass[/register]`)
const ACTOR = 'customer'
const PROVIDER = 'emailpass'

// The only place on the server that knows Medusa's customer and auth calls
// (`emailpass` for the `customer` actor, the bearer header). The handlers in
// server/api/customers/** keep the HTTP side: the parsed body, the
// `medusa_jwt` cookie and the statuses.
//
// It takes the request's own client (`serverMedusaClient(event)`), never one
// shared at module level, and every call that acts as a customer gets that
// customer's token as an argument and sends it as `Authorization: Bearer
// <token>` itself, so nothing depends on a token kept on the client.
//
// Login and register use the SDK's auth.login()/auth.register(). That is
// safe only with the server client's `auth: { type: 'jwt',
// jwtTokenStorageMethod: 'nostore' }` (server/utils/medusa.ts): with the
// page client's `type: 'session'`, auth.login() follows the token with
// `POST /auth/session`, a Medusa cookie session this server never uses and
// nothing ends (#82), and with 'local' storage auth.register() rejects
// unhandled on the server. tests/unit/server/customer.repository.test.ts runs
// both against the installed SDK with that config and a stubbed network.
//
// Medusa errors are not caught or reported here: they reach
// defineWrappedResponseHandler(), which reports them once (source
// `server-api`) and keeps their status and message, as it did before this
// repository existed.
export function customerRepository(medusa: Medusa) {
  return {
    // Returns the session token. Medusa also answers a login with a redirect
    // (`location`, third-party auth), an MFA challenge or a verification
    // step, which the SDK returns as an object; none of them is a session for
    // this store, so they are an unexpected answer (a 500 through the handler
    // wrapper). An answer without a token is one too: the SDK throws on it.
    async login({ email, password }: LoginCustomerData): Promise<string> {
      const answer = await medusa.auth.login(ACTOR, PROVIDER, {
        email,
        password,
      })

      if (typeof answer !== 'string') {
        throw new Error('Unexpected login response from Medusa')
      }

      return answer
    },

    // Creates the auth identity only and returns its token (the SDK throws
    // when there is none); the customer itself is created with
    // createCustomer() and that token.
    async register({
      email,
      password,
    }: Pick<RegisterCustomerData, 'email' | 'password'>): Promise<string> {
      return await medusa.auth.register(ACTOR, PROVIDER, { email, password })
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
