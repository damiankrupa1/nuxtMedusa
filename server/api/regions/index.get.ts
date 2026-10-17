import { serverMedusaClient } from '#medusa/server'

// The region middleware needs the regions on every server render, and they
// rarely change, so they are cached instead of asked from Medusa each time
export default defineCachedEventHandler(
  defineWrappedResponseHandler(async (event) => {
    const medusa = serverMedusaClient(event)

    return await medusa.store.region.list({
      fields:
        'id,countries.iso_2,countries.name,countries.display_name,countries.region_id',
    })
  }),
  { name: 'regions', maxAge: 60 * 10, staleMaxAge: 60 * 60, swr: true },
)
