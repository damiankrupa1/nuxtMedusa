import { customerRepository } from '../repository/customer.repository'
import type {
  LoginCustomerData,
  RegisterCustomerData,
  UpdateCustomerData,
} from '~/types/customer'

export const useCustomerService = () => {
  const {
    fetchCustomer,
    registerCustomer,
    loginCustomer,
    logoutCustomer,
    updateCustomer: repositoryUpdateCustomer,
  } = customerRepository()

  const getCustomer = async () => await fetchCustomer()

  const register = async (data: RegisterCustomerData) => {
    const response = await registerCustomer(data)
    await refreshNuxtData('customer')
    return response
  }

  const login = async (data: LoginCustomerData) => {
    const response = await loginCustomer(data)
    await refreshNuxtData('customer')
    return response
  }

  const logout = async () => {
    await logoutCustomer()
    await refreshNuxtData('customer')
  }

  const updateCustomer = async (data: UpdateCustomerData) => {
    const response = await repositoryUpdateCustomer(data)
    await refreshNuxtData('customer')
    return response
  }

  return {
    getCustomer,
    register,
    login,
    logout,
    updateCustomer,
  }
}
