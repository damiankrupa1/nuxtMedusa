import { apiRepository } from './api.repository'
import type {
  CustomerResponse,
  LoginCustomerData,
  RegisterCustomerData,
  UpdateCustomerData,
} from '~/types/customer'

export function customerRepository() {
  const { request } = apiRepository()

  return {
    async fetchCustomer(): Promise<CustomerResponse> {
      return await request($fetch<CustomerResponse>('/api/customers/me'))
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

    async updateCustomer(
      data: UpdateCustomerData,
    ): Promise<CustomerResponse> {
      return await request(
        $fetch<CustomerResponse>('/api/customers/me', {
          method: 'POST',
          body: data,
        }),
      )
    },
  }
}
