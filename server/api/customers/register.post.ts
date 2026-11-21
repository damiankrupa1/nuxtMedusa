import { serverMedusaClient } from '~~/server/utils/medusa'
import { registerRequestSchema } from '~/types/customer'
import { customerRepository } from '~~/server/repository/customer.repository'
import {
  clearSessionCookie,
  setSessionCookie,
} from '~~/server/utils/session-cookie'
import { parseRequestInput } from '~~/server/utils/validation'

// Medusa registers the auth identity first and the customer with its token
// second. As for login, the session cookie is set only when both succeeded
// and cleared when the second call fails (Medusa's error goes on unchanged).
// The auth identity from the first call then stays without a customer, so
// signing up again with that email gets Medusa's "Identity with email already
// exists", as it did before.
export default defineWrappedResponseHandler(async (event) => {
  const body = parseRequestInput(
    registerRequestSchema,
    await readBody(event),
    'body',
  )
  const customers = customerRepository(serverMedusaClient(event))

  const token = await customers.register(body)

  try {
    const response = await customers.createCustomer(token, body)
    setSessionCookie(event, token)
    return response
  } catch (error) {
    clearSessionCookie(event)
    throw error
  }
})
