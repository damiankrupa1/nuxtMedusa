/**
 * @jest-environment node
 */
import { describe, expect, it } from '@jest/globals'
import { createError } from 'h3'
import { z } from 'zod'

import { parseRequestInput } from '~~/server/utils/validation'

// Nitro auto-imports it in server code
Object.assign(globalThis, { createError })

const schema = z.object({
  email: z.email(),
  limit: z.coerce.number().int().optional(),
})

const catchError = (run: () => unknown) => {
  try {
    run()
  } catch (error) {
    return error
  }
  throw new Error('Expected parseRequestInput to throw')
}

describe('parseRequestInput', () => {
  it('returns the parsed input, without fields the schema does not know', () => {
    expect(
      parseRequestInput(
        schema,
        { email: 'jan@example.com', limit: '5', fields: '*' },
        'query',
      ),
    ).toEqual({ email: 'jan@example.com', limit: 5 })
  })

  it('answers invalid input with a 400 and the flattened issues', () => {
    const error = catchError(() =>
      parseRequestInput(schema, { email: 'a@', limit: 'x' }, 'body'),
    )

    expect(error).toMatchObject({
      statusCode: 400,
      statusMessage: 'Validation Error',
      message: 'Invalid request body',
      data: {
        formErrors: [],
        fieldErrors: {
          email: ['Invalid email address'],
          limit: [expect.any(String)],
        },
      },
    })
  })

  it('reports input that is not an object at all as a form error', () => {
    const error = catchError(() =>
      parseRequestInput(schema, undefined, 'route params'),
    )

    expect(error).toMatchObject({
      statusCode: 400,
      message: 'Invalid request route params',
      data: { formErrors: [expect.any(String)], fieldErrors: {} },
    })
  })
})
