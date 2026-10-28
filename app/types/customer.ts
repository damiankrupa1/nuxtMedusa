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

// One definition per form for the client and the server. The form passes
// vue-i18n's `t`, so its messages are translated; server/api/customers/**
// uses the schemas built without `t` (below), which keep zod's own English
// messages for the 400 it answers to a request the form would have refused.
export const buildSigninSchema = (t?: (key: string) => string) =>
  z.object({
    email: z.email(t?.('validation.emailInvalid')),
    password: z.string().min(1, t?.('validation.passwordRequired')),
  })

export type SigninForm = z.infer<ReturnType<typeof buildSigninSchema>>

export const buildRegisterSchema = (t?: (key: string) => string) =>
  z.object({
    first_name: z.string().min(2, t?.('validation.firstNameMin')),
    last_name: z.string().min(2, t?.('validation.lastNameMin')),
    email: z.email(t?.('validation.emailInvalid')),
    phone: z.string().optional(),
    password: z.string().min(6, t?.('validation.passwordMin')),
  })

export type RegisterForm = z.infer<ReturnType<typeof buildRegisterSchema>>

export const signinRequestSchema = buildSigninSchema()

export const registerRequestSchema = buildRegisterSchema()

// Profile update (server/api/customers/me.post.ts). No form collects it yet,
// so it reuses the registration rules for the fields Medusa's store API lets
// a customer change; anything else (email, password, metadata) is dropped
// instead of being forwarded to Medusa.
export const updateCustomerRequestSchema = registerRequestSchema
  .pick({ first_name: true, last_name: true, phone: true })
  .partial()

export type UpdateCustomerData = z.infer<typeof updateCustomerRequestSchema>
