import { serverMedusaClient } from '#medusa/server'
import { catalogHandleParamsSchema } from '~/types/catalog'
import { parseRequestInput } from '~~/server/utils/validation'

export default defineWrappedResponseHandler(async (event) => {
  const medusa = serverMedusaClient(event)
  const { handle } = parseRequestInput(
    catalogHandleParamsSchema,
    getRouterParams(event),
    'route params',
  )

  const response = await medusa.store.collection.list({
    handle,
    fields: 'handle,title',
  })

  return response.collections[0]
})
