import { serverMedusaClient } from '#medusa/server'
import { updateCustomerRequestSchema } from '~/types/customer'
import { parseRequestInput } from '~~/server/utils/validation'

export default defineWrappedResponseHandler(async (event) => {
  const token = getCookie(event, 'medusa_jwt')

  if (!token || typeof token !== 'string') {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const body = parseRequestInput(
    updateCustomerRequestSchema,
    await readBody(event),
    'body',
  )
  const medusa = serverMedusaClient(event)

  return await medusa.store.customer.update(
    body,
    {},
    { Authorization: `Bearer ${token}` },
  )
})
