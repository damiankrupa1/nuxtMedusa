import { customerRepository } from '../repository/customer.repository'
import { useCustomerService } from '../services/customer.service'
import type {
  CustomerResponse,
  LoginCustomerData,
  RegisterCustomerData,
  UpdateCustomerData,
} from '~/types/customer'

const extractErrorMessage = (err: unknown, fallback: string) => {
  const errorResponse = err as {
    data?: { message?: string }
    message?: string
  }

  return errorResponse.data?.message || errorResponse.message || fallback
}

export const useFetchCustomer = () => {
  const { fetchCustomer } = customerRepository()
  return useLazyAsyncData('customer', async () => await fetchCustomer())
}

export const useCustomer = () => {
  const { data: customerData } = useFetchCustomer()

  return {
    customer: computed(() => customerData.value?.customer || null),
    isAuthenticated: computed(() => !!customerData.value?.customer),
  }
}

export const useRegisterCustomer = () => {
  const { register } = useCustomerService()

  const loading = ref(false)
  const error = ref<string | null>(null)
  const data = ref<CustomerResponse>()

  const mutate = async (registerData: RegisterCustomerData) => {
    loading.value = true
    error.value = null

    try {
      data.value = await register(registerData)
      return data.value
    } catch (err: unknown) {
      error.value = extractErrorMessage(
        err,
        'An error occurred during registration',
      )
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    data,
    loading,
    error,
    mutate,
  }
}

export const useLoginCustomer = () => {
  const { login } = useCustomerService()

  const loading = ref(false)
  const error = ref<string | null>(null)
  const data = ref<CustomerResponse>()

  const mutate = async (loginData: LoginCustomerData) => {
    loading.value = true
    error.value = null

    try {
      data.value = await login(loginData)
      return data.value
    } catch (err: unknown) {
      error.value = extractErrorMessage(err, 'Invalid email or password')
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    data,
    loading,
    error,
    mutate,
  }
}

export const useLogoutCustomer = () => {
  const { logout } = useCustomerService()

  const loading = ref(false)

  const mutate = async () => {
    loading.value = true

    try {
      await logout()
    } catch {
      // Silence error
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    mutate,
  }
}

export const useUpdateCustomer = () => {
  const { updateCustomer } = useCustomerService()

  const loading = ref(false)
  const error = ref<string | null>(null)
  const data = ref<CustomerResponse>()

  const mutate = async (updateData: UpdateCustomerData) => {
    loading.value = true
    error.value = null

    try {
      data.value = await updateCustomer(updateData)
      return data.value
    } catch (err: unknown) {
      const errorResponse = err as { status?: number }

      if (errorResponse.status === 401) {
        await refreshNuxtData('customer')
      }

      error.value = extractErrorMessage(
        err,
        'An error occurred while updating your profile',
      )
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    data,
    loading,
    error,
    mutate,
  }
}
