import { z } from 'zod'

// Request input of the server/api/products, categories and collections
// handlers. Each schema is a whitelist: only the listed query parameters reach
// Medusa (unknown ones are dropped), and `fields` always stays server-side.

export const PRODUCT_LIST_MAX_LIMIT = 100

// Sort orders Medusa can apply itself; price sorting happens in the app
// (see sortProducts() in app/utils/product.ts), so it isn't one of them.
export const PRODUCT_LIST_ORDERS = [
  'created_at',
  '-created_at',
  'updated_at',
  '-updated_at',
  'title',
  '-title',
] as const

const idSchema = z.string().trim().min(1)

// A repeated query key (`?category_id=a&category_id=b`) arrives as an array
const idFilterSchema = z.union([idSchema, z.array(idSchema).min(1)])

export const catalogHandleParamsSchema = z.object({
  handle: z.string().trim().min(1).max(255),
})

export const productListQuerySchema = z.object({
  // A larger page is clamped instead of refused, so a caller can't make the
  // store walk the whole catalog in one request.
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .transform((limit) => Math.min(limit, PRODUCT_LIST_MAX_LIMIT))
    .optional(),
  offset: z.coerce.number().int().min(0).optional(),
  order: z.enum(PRODUCT_LIST_ORDERS).default('created_at'),
  collection_id: idFilterSchema.optional(),
  category_id: idFilterSchema.optional(),
  region_id: idSchema.optional(),
})

export type ProductListQuery = z.infer<typeof productListQuerySchema>

export const productByHandleQuerySchema = z.object({
  region_id: idSchema.optional(),
})

export type ProductByHandleQuery = z.infer<typeof productByHandleQuerySchema>
