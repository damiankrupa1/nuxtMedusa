import { serverMedusaClient } from '#medusa/server'
import {
  catalogHandleParamsSchema,
  productByHandleQuerySchema,
} from '~/types/catalog'
import { parseRequestInput } from '~~/server/utils/validation'

export default defineWrappedResponseHandler(async (event) => {
  const medusa = serverMedusaClient(event)
  const { handle } = parseRequestInput(
    catalogHandleParamsSchema,
    getRouterParams(event),
    'route params',
  )
  const query = parseRequestInput(
    productByHandleQuerySchema,
    getQuery(event),
    'query',
  )

  const response = await medusa.store.product.list({
    ...query,
    fields: '*variants,*variants.calculated_price,+variants.inventory_quantity',
    handle,
  })

  return response.products[0]
})
