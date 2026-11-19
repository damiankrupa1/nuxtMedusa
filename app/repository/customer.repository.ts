import { apiRepository } from '~/repository/api.repository'
import type {
  CustomerResponse,
  LoginCustomerData,
  RegisterCustomerData,
  UpdateCustomerData,
} from '~/types/customer'

export function customerRepository() {
  const { request } = apiRepository()
  // The session is the HttpOnly `medusa_jwt` cookie, so `me` must be asked
  // with the visitor's cookies. In a server render the global $fetch sends
  // none (the customer always looked signed out); useRequestFetch() forwards
  // the page request's headers. In the browser it is $fetch itself. Taken
  // here, while the Nuxt context of the calling setup is active.
  const requestFetch = useRequestFetch()

  return {
    async fetchCustomer(): Promise<CustomerResponse> {
      return await request(requestFetch<CustomerResponse>('/api/customers/me'))
    },

    async registerCustomer(
      data: RegisterCustomerData,
    ): Promise<CustomerResponse> {
      return await request(
        $fetch<CustomerResponse>('/api/customers/register', {
          method: 'POST',
          body: data,
        }),
      )
    },

    async loginCustomer(data: LoginCustomerData): Promise<CustomerResponse> {
      return await request(
        $fetch<CustomerResponse>('/api/customers/login', {
          method: 'POST',
          body: data,
        }),
      )
    },

    async logoutCustomer(): Promise<void> {
      await request(
        $fetch('/api/customers/logout', {
          method: 'DELETE',
        }),
      )
    },

    async updateCustomer(data: UpdateCustomerData): Promise<CustomerResponse> {
      return await request(
        $fetch<CustomerResponse>('/api/customers/me', {
          method: 'POST',
          body: data,
        }),
      )
    },
  }
}
