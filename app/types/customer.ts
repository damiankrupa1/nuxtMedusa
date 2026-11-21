import { z } from 'zod'
import type {
  AuthMfaRequiredResponse,
  AuthVerificationRequiredResponse,
} from '@medusajs/js-sdk'
import type { StoreCustomer, StoreCustomerResponse } from '@medusajs/types'
import type { MedusaResponseShape } from '~/types/medusa'

// Medusa's answers to server/repository/customer.repository.ts, checked with
// parseMedusaResponse() and the hard policy (a session never goes on with
// half an answer). Only what the storefront reads: the token of login,
// register and refresh, the customer's id and what the account page shows.

// A login or registration answers the token itself (the SDK's auth.login()
// and auth.register()); anything else is not a session for this store
export const medusaTokenSchema = z.string().min(1)

// `POST /auth/token/refresh` (the SDK's auth.refresh()). An MFA challenge or
// a verification step also carries a `token`, but one without an actor, so
// it is refused like it is for login.
export const medusaTokenRefreshSchema = z.looseObject({
  token: medusaTokenSchema,
  mfa_required: z.never().optional(),
  verification_required: z.never().optional(),
} satisfies MedusaResponseShape<
  Partial<AuthMfaRequiredResponse & AuthVerificationRequiredResponse>
>)

export const medusaCustomerSchema = z.looseObject({
  id: z.string().min(1),
  email: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  phone: z.string().nullish(),
} satisfies MedusaResponseShape<StoreCustomer>)

export const medusaCustomerResponseSchema = z.looseObject({
  customer: medusaCustomerSchema,
} satisfies MedusaResponseShape<StoreCustomerResponse>)

// What server/api/customers/** answers: Medusa's customer as checked above,
// or no customer (no session, or Medusa refused the token)
export type Customer = z.infer<typeof medusaCustomerSchema>

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
