import { serverMedusaClient } from '#medusa/server'
import { signinRequestSchema } from '~/types/customer'
import { parseRequestInput } from '~~/server/utils/validation'

export default defineWrappedResponseHandler(async (event) => {
  const medusa = serverMedusaClient(event)
  const { email, password } = parseRequestInput(
    signinRequestSchema,
    await readBody(event),
    'body',
  )

  const token = await medusa.auth.login('customer', 'emailpass', {
    email,
    password,
  })

  if (typeof token !== 'string') {
    throw new Error('Unexpected login response from Medusa')
  }

  setCookie(event, 'medusa_jwt', token)

  return await medusa.store.customer.retrieve(
    {},
    {
      Authorization: `Bearer ${token}`,
    },
  )
})
