import { serverMedusaClient } from '#medusa/server'

export default defineWrappedResponseHandler(async (event) => {
  const medusa = serverMedusaClient(event)
  const body = await readBody(event)

  const token = getCookie(event, 'medusa_jwt')

  if (!token || typeof token !== 'string') {
    throw new Error('Missing authentication token')
  }

  // Update customer information
  return await medusa.store.customer.update(body)
})
