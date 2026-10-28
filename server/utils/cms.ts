import type { CmsGlobalSlug } from '~/types/cms'
import { CMS_GLOBAL_SLUGS } from '~/types/cms'

// Deepest relationship level the storefront reads (images are depth 1), so
// the proxy can't be used to ask Payload for arbitrarily deep, costly trees.
const MAX_DEPTH = 2

export const isCmsGlobalSlug = (slug: unknown): slug is CmsGlobalSlug =>
  CMS_GLOBAL_SLUGS.some((known) => known === slug)

// `null` for a query Payload shouldn't be asked: a locale that isn't a plain
// language tag (it ends up in the upstream URL) or an out-of-range depth.
// A missing depth is 0, like cms.repository.ts's default.
export const parseCmsGlobalQuery = (query: {
  locale?: unknown
  depth?: unknown
}): { locale: string; depth: number } | null => {
  const { locale } = query
  const depth = query.depth === undefined ? 0 : Number(query.depth)

  if (typeof locale !== 'string' || !/^[a-z]{2}(-[A-Za-z]{2})?$/.test(locale)) {
    return null
  }
  if (!Number.isInteger(depth) || depth < 0 || depth > MAX_DEPTH) return null

  return { locale, depth }
}
