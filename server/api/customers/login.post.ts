import { serverMedusaClient } from '#medusa/server'
import { signinRequestSchema } from '~/types/customer'
import { customerRepository } from '~~/server/repository/customer.repository'
import { parseRequestInput } from '~~/server/utils/validation'

// The cookie is set as soon as Medusa hands out the token, before the
// customer is retrieved, so it stays set when that second call fails.
// Its attributes are h3's defaults (`Path=/` only); keep them in step with
// register.post.ts and logout.delete.ts.
export default defineWrappedResponseHandler(async (event) => {
  const credentials = parseRequestInput(
    signinRequestSchema,
    await readBody(event),
    'body',
  )
  const customers = customerRepository(serverMedusaClient(event))

  const token = await customers.login(credentials)

  setCookie(event, 'medusa_jwt', token)

  return await customers.retrieveCustomer(token)
})
