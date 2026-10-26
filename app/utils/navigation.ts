import type { PrimaryNavItem } from '~/types/navigation'

// TODO: point each entry at its real category/collection route once the
// matching Medusa categories/collections exist in the connected backend.
export const primaryNav: PrimaryNavItem[] = [
  { labelKey: 'app.header.nav.newIn', to: '/store' },
  { labelKey: 'app.header.nav.clothing', to: '/store' },
  { labelKey: 'app.header.nav.shoes', to: '/store' },
  { labelKey: 'app.header.nav.bagsAndAccessories', to: '/store' },
  { labelKey: 'app.header.nav.brands', to: '/store' },
  { labelKey: 'app.header.nav.studio', to: '/store' },
  { labelKey: 'app.header.nav.inspiration', to: '/store' },
  { labelKey: 'app.header.nav.lastPieces', to: '/store' },
]
