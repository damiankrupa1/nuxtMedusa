import { serverMedusaClient } from '#medusa/server'
import { customerRepository } from '~~/server/repository/customer.repository'
import { getSessionToken } from '~~/server/utils/session-cookie'
import type { MedusaError } from '~~/server/types/medusa-error'

export default defineWrappedResponseHandler(async (event) => {
  const token = getSessionToken(event)

  // No session: nobody is signed in, and Medusa isn't asked
  if (!token) return { customer: null }

  try {
    return await customerRepository(serverMedusaClient(event)).retrieveCustomer(
      token,
    )
  } catch (error) {
    // Medusa refused the token (expired or invalid): nobody is signed in,
    // which is an answer, not an error, and isn't reported
    if ((error as MedusaError).status === 401) {
      return { customer: null }
    }

    // For any other error, propagate it to the global handler
    throw error
  }
})
