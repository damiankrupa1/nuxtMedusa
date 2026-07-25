export interface Customer {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  created_at: string
  updated_at: string
  has_account: boolean
}

export interface CustomerResponse {
  customer: Customer | null
}

export interface RegisterCustomerData {
  first_name: string
  last_name: string
  email: string
  password: string
  phone?: string
}

export interface LoginCustomerData {
  email: string
  password: string
}

export interface UpdateCustomerData {
  first_name?: string
  last_name?: string
  email?: string
  password?: string
  phone?: string
}
