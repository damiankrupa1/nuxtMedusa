import { serverMedusaClient } from '#medusa/server'
import { productListQuerySchema } from '~/types/catalog'
import { parseRequestInput } from '~~/server/utils/validation'

export default defineWrappedResponseHandler(async (event) => {
  const medusa = serverMedusaClient(event)
  const query = parseRequestInput(
    productListQuerySchema,
    getQuery(event),
    'query',
  )

  return await medusa.store.product.list({
    ...query,
    fields: '*variants,*variants.calculated_price,+variants.inventory_quantity',
  })
})
