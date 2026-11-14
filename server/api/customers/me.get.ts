import { serverMedusaClient } from '#medusa/server'
import { customerRepository } from '~~/server/repository/customer.repository'
import type { MedusaError } from '~~/server/types/medusa-error'

export default defineWrappedResponseHandler(async (event) => {
  const token = getCookie(event, 'medusa_jwt')

  try {
    return await customerRepository(serverMedusaClient(event)).retrieveCustomer(
      token,
    )
  } catch (error) {
    // Medusa refused the token (expired, or no cookie at all): nobody is
    // signed in, which is an answer, not an error, and isn't reported
    if ((error as MedusaError).status === 401) {
      return { customer: null }
    }

    // For any other error, propagate it to the global handler
    throw error
  }
})
