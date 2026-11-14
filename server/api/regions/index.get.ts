import { medusaRepository } from '~~/server/repository/medusa.repository'

// The region middleware needs the regions on every server render, and they
// rarely change, so they are cached instead of asked from Medusa each time.
// The handler only does HTTP (cache); the Medusa call, its error mapping and
// its reporting live in server/repository/medusa.repository.ts.
export default defineCachedEventHandler(
  (event) => medusaRepository(event).listRegions(),
  { name: 'regions', maxAge: 60 * 10, staleMaxAge: 60 * 60, swr: true },
)
