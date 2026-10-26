import { z } from 'zod'

export const buildNewsletterSchema = (t: (key: string) => string) =>
  z.object({
    email: z.email(t('app.newsletter.errorEmail')),
    consent: z.boolean().refine((value) => value === true, {
      message: t('app.newsletter.errorConsent'),
    }),
  })

export type NewsletterForm = z.infer<ReturnType<typeof buildNewsletterSchema>>
