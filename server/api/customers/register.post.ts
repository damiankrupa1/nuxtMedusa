import { serverMedusaClient } from '#medusa/server'
import { registerRequestSchema } from '~/types/customer'
import { customerRepository } from '~~/server/repository/customer.repository'
import { parseRequestInput } from '~~/server/utils/validation'

// Medusa registers the auth identity first and the customer with its token
// second. The cookie is set in between, as for login, so it stays set when
// creating the customer fails.
export default defineWrappedResponseHandler(async (event) => {
  const body = parseRequestInput(
    registerRequestSchema,
    await readBody(event),
    'body',
  )
  const customers = customerRepository(serverMedusaClient(event))

  const token = await customers.register(body)

  setCookie(event, 'medusa_jwt', token)

  return await customers.createCustomer(token, body)
})
