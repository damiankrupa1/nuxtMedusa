import { serverMedusaClient } from '~~/server/utils/medusa'
import { signinRequestSchema } from '~/types/customer'
import { customerRepository } from '~~/server/repository/customer.repository'
import {
  clearSessionCookie,
  setSessionCookie,
} from '~~/server/utils/session-cookie'
import { parseRequestInput } from '~~/server/utils/validation'

// The session cookie is set only once both Medusa calls succeeded. When the
// second one fails, the cookie is cleared instead (which also drops a session
// the browser had before) and Medusa's error goes on unchanged, reported once
// by the handler wrapper. Same as register.post.ts.
export default defineWrappedResponseHandler(async (event) => {
  const credentials = parseRequestInput(
    signinRequestSchema,
    await readBody(event),
    'body',
  )
  const customers = customerRepository(serverMedusaClient(event))

  const token = await customers.login(credentials)

  try {
    const response = await customers.retrieveCustomer(token)
    setSessionCookie(event, token)
    return response
  } catch (error) {
    clearSessionCookie(event)
    throw error
  }
})
