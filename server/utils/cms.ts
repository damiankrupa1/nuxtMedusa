import type { CmsGlobalQuery, CmsGlobalSlug } from '~/types/cms'
import { cmsGlobalQuerySchema, cmsGlobalSlugSchema } from '~/types/cms'
import { parseRequestInput } from '~~/server/utils/validation'

export const isCmsGlobalSlug = (slug: unknown): slug is CmsGlobalSlug =>
  cmsGlobalSlugSchema.safeParse(slug).success

// Throws a 400 with the issues for a query Payload shouldn't be asked: a
// locale that isn't a plain language tag or an out-of-range depth (see
// cmsGlobalQuerySchema).
export const parseCmsGlobalQuery = (query: unknown): CmsGlobalQuery =>
  parseRequestInput(cmsGlobalQuerySchema, query, 'query')
