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

  const response = await medusa.store.category.list({
    handle,
    fields: 'handle,name',
  })

  return response.product_categories[0]
})
