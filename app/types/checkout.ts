import * as z from 'zod'

export const buildAddressSchema = (t: (key: string) => string) =>
  z.object({
    shipping_address: z.object({
      first_name: z
        .string({ required_error: t('validation.firstNameRequired') })
        .min(1, t('validation.firstNameRequired')),
      last_name: z
        .string({ required_error: t('validation.lastNameRequired') })
        .min(1, t('validation.lastNameRequired')),
      address_1: z
        .string({ required_error: t('validation.addressRequired') })
        .min(1, t('validation.addressRequired')),
      address_2: z.string().optional(),
      company: z.string().optional(),
      postal_code: z
        .string({ required_error: t('validation.postalCodeRequired') })
        .min(1, t('validation.postalCodeRequired')),
      city: z
        .string({ required_error: t('validation.cityRequired') })
        .min(1, t('validation.cityRequired')),
      country_code: z
        .string({ required_error: t('validation.countryRequired') })
        .min(1, t('validation.countryRequired')),
      province: z.string().optional(),
      phone: z.string().optional(),
    }),
    email: z
      .string({ required_error: t('validation.emailRequired') })
      .email(t('validation.emailInvalid')),
    billing_address: z.object({
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      address_1: z.string().optional(),
      address_2: z.string().optional(),
      company: z.string().optional(),
      postal_code: z.string().optional(),
      city: z.string().optional(),
      country_code: z.string().optional(),
      province: z.string().optional(),
      phone: z.string().optional(),
    }),
  })

export type Schema = z.infer<ReturnType<typeof buildAddressSchema>>

export interface PartialSchema {
  shipping_address: Partial<Schema['shipping_address']>
  email?: Schema['email']
  billing_address: Partial<Schema['billing_address']>
}
