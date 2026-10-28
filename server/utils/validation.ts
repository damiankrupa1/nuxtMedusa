import { z } from 'zod'

export type RequestInputPart = 'body' | 'query' | 'route params'

// Parses a handler's input (readBody, getQuery, getRouterParams) with its
// schema from app/types, so the handler only ever sees the parsed data.
// Invalid input is the caller's mistake: a 400 with zod's flattened issues
// (`data.fieldErrors`), never a Medusa error or a 500. h3's own
// readValidatedBody/getValidatedQuery aren't used because they wrap whatever
// the validator throws in a second error, which buries those issues.
export function parseRequestInput<Schema extends z.ZodType>(
  schema: Schema,
  input: unknown,
  part: RequestInputPart,
): z.output<Schema> {
  const result = schema.safeParse(input)
  if (result.success) return result.data

  throw createError({
    statusCode: 400,
    statusMessage: 'Validation Error',
    message: `Invalid request ${part}`,
    data: z.flattenError(result.error),
  })
}
