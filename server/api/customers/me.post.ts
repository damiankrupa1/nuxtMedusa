import { serverMedusaClient } from '#medusa/server'
import { updateCustomerRequestSchema } from '~/types/customer'
import { parseRequestInput } from '~~/server/utils/validation'

export default defineWrappedResponseHandler(async (event) => {
  const medusa = serverMedusaClient(event)
  const body = parseRequestInput(
    updateCustomerRequestSchema,
    await readBody(event),
    'body',
  )

  const token = getCookie(event, 'medusa_jwt')

  if (!token || typeof token !== 'string') {
    throw new Error('Missing authentication token')
  }

  // Update customer information
  return await medusa.store.customer.update(body)
})
