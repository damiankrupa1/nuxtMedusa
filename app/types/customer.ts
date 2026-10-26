import { z } from 'zod'

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

export type RegisterCustomerData = RegisterForm

export type LoginCustomerData = SigninForm

export interface UpdateCustomerData {
  first_name?: string
  last_name?: string
  email?: string
  password?: string
  phone?: string
}

export const buildSigninSchema = (t: (key: string) => string) =>
  z.object({
    email: z.email(t('validation.emailInvalid')),
    password: z.string().min(1, t('validation.passwordRequired')),
  })

export type SigninForm = z.infer<ReturnType<typeof buildSigninSchema>>

export const buildRegisterSchema = (t: (key: string) => string) =>
  z.object({
    first_name: z.string().min(2, t('validation.firstNameMin')),
    last_name: z.string().min(2, t('validation.lastNameMin')),
    email: z.email(t('validation.emailInvalid')),
    phone: z.string().optional(),
    password: z.string().min(6, t('validation.passwordMin')),
  })

export type RegisterForm = z.infer<ReturnType<typeof buildRegisterSchema>>
