import type Medusa from '@medusajs/js-sdk'
import type { StoreCustomerResponse } from '@medusajs/types'
import type {
  LoginCustomerData,
  RegisterCustomerData,
  UpdateCustomerData,
} from '~/types/customer'

const bearer = (token: string | undefined) => ({
  Authorization: `Bearer ${token}`,
})

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
// Medusa errors are not caught or reported here: they reach
// defineWrappedResponseHandler(), which reports them once (source
// `server-api`) and keeps their status and message, as it did before this
// repository existed.
export function customerRepository(medusa: Medusa) {
  return {
    // Returns the session token. Medusa also answers a login with a redirect
    // (third-party auth), an MFA challenge or a verification step; none of
    // them is a session for this store, so they are an unexpected answer
    // (a 500 through the handler wrapper).
    async login({ email, password }: LoginCustomerData): Promise<string> {
      const token = await medusa.auth.login('customer', 'emailpass', {
        email,
        password,
      })

      if (typeof token !== 'string') {
        throw new Error('Unexpected login response from Medusa')
      }

      return token
    },

    // Creates the auth identity only and returns its token; the customer
    // itself is created with createCustomer() and that token.
    async register({
      email,
      password,
    }: Pick<RegisterCustomerData, 'email' | 'password'>): Promise<string> {
      return await medusa.auth.register('customer', 'emailpass', {
        email,
        password,
      })
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
    // it as an error. `token` may be undefined because GET me asks Medusa
    // even without a cookie (`Bearer undefined`, answered with a 401), as it
    // always has.
    async retrieveCustomer(
      token: string | undefined,
    ): Promise<StoreCustomerResponse> {
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
