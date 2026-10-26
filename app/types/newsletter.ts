import { z } from 'zod'

export const buildNewsletterSchema = (t: (key: string) => string) =>
  z.object({
    email: z.email(t('app.newsletter.errorEmail')),
    interests: z.object({
      women: z.boolean(),
      men: z.boolean(),
    }),
    consent: z.boolean().refine((value) => value === true, {
      message: t('app.newsletter.errorConsent'),
    }),
  })

export type NewsletterForm = z.infer<ReturnType<typeof buildNewsletterSchema>>

export const createNewsletterForm = (): NewsletterForm => ({
  email: '',
  interests: { women: false, men: false },
  consent: false,
})
