import { serverMedusaClient } from '#medusa/server'
import { updateCustomerRequestSchema } from '~/types/customer'
import { customerRepository } from '~~/server/repository/customer.repository'
import { parseRequestInput } from '~~/server/utils/validation'

export default defineWrappedResponseHandler(async (event) => {
  const token = getCookie(event, 'medusa_jwt')

  // Before the body is read and before Medusa is asked
  if (!token || typeof token !== 'string') {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const body = parseRequestInput(
    updateCustomerRequestSchema,
    await readBody(event),
    'body',
  )

  return await customerRepository(serverMedusaClient(event)).updateCustomer(
    token,
    body,
  )
})
