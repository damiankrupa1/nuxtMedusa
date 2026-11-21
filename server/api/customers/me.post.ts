import { serverMedusaClient } from '~~/server/utils/medusa'
import { updateCustomerRequestSchema } from '~/types/customer'
import { customerRepository } from '~~/server/repository/customer.repository'
import { getSessionToken } from '~~/server/utils/session-cookie'
import { parseRequestInput } from '~~/server/utils/validation'

export default defineWrappedResponseHandler(async (event) => {
  const token = getSessionToken(event)

  // Before the body is read and before Medusa is asked
  if (!token) {
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
