import type { z } from 'zod'

import type {
  MedusaDeepPartial,
  MedusaResponsePolicy,
  MedusaResponseResult,
} from '~/types/medusa'
import { MEDUSA_RESPONSE_POLICY } from '~/types/medusa'
import { captureError } from '~/utils/capture-error'
import { shouldReportOnce } from '~/utils/report-once'

// Imported by server/repository too, which Nitro doesn't auto-import for, so
// every dependency is imported explicitly.

// The error reported for each distinct invalid answer. A repeat hands out the
// same instance: Sentry marks an error it captured, and its Nitro hook skips
// an H3 error whose `cause` carries that mark, so a caller that throws one
// with this error as its cause isn't reported again by the hook either.
const reportedErrors = new Map<string, Error>()

const toMessage = (label: string) => `Unexpected ${label} response from Medusa`

// The zod issues as paths, codes and messages only: zod leaves the received
// values out (no `reportInput`), so nothing of the answer (a token, a
// customer's e-mail) reaches a message, a cause or a Sentry event.
function toIssues(error: z.ZodError) {
  return error.issues.map(({ code, path, message }) => ({
    code,
    path: path.join('.') || '(root)',
    message,
  }))
}

function reportOnce(label: string, error: z.ZodError): Error {
  const issues = toIssues(error)
  const key = `medusa:${label}:${issues.map(({ path, code }) => `${path}:${code}`).join('|')}`

  let reported = reportedErrors.get(key)
  if (shouldReportOnce(key) || !reported) {
    reported = new Error(toMessage(label), { cause: error })
    captureError(reported, {
      source: 'medusa',
      type: 'invalid_response',
      response: label,
      issues,
    })
    reportedErrors.set(key, reported)
  }

  return reported
}

/**
 * Checks a Medusa answer against a narrow schema of the fields the code reads
 * (loose objects: a field Medusa adds never fails it) and returns `data`
 * itself, typed by the SDK and by the schema. The schemas have no transforms
 * or defaults, so the parsed copy would hold the same values.
 *
 * - `hard` (session, payments): throws `Unexpected <label> response from
 *   Medusa`, with the zod error as its cause, and reports nothing. The caller's
 *   own error path reports it once: defineWrappedResponseHandler() on the
 *   server (`source: 'server-api'`), apiRepository().request() in the app.
 * - `soft` (data that is displayed or routed on): reports once per distinct
 *   failure per server instance or page load (`source: 'medusa'`,
 *   `type: 'invalid_response'`, the issues in `extra`), like a Payload global
 *   that doesn't match, and returns `{ success: false, error }` for the
 *   caller to turn into its existing error state. `error` is the reported
 *   error, the same instance for every repeat.
 */
export function parseMedusaResponse<
  T,
  Schema extends z.ZodType<MedusaDeepPartial<T>>,
>(
  schema: Schema,
  data: T,
  label: string,
  policy: typeof MEDUSA_RESPONSE_POLICY.hard,
): T & z.output<Schema>
export function parseMedusaResponse<
  T,
  Schema extends z.ZodType<MedusaDeepPartial<T>>,
>(
  schema: Schema,
  data: T,
  label: string,
  policy: typeof MEDUSA_RESPONSE_POLICY.soft,
): MedusaResponseResult<T & z.output<Schema>>
export function parseMedusaResponse<
  T,
  Schema extends z.ZodType<MedusaDeepPartial<T>>,
>(
  schema: Schema,
  data: T,
  label: string,
  policy: MedusaResponsePolicy,
): (T & z.output<Schema>) | MedusaResponseResult<T & z.output<Schema>> {
  const result = schema.safeParse(data)
  const valid = data as T & z.output<Schema>

  if (policy === MEDUSA_RESPONSE_POLICY.hard) {
    if (!result.success) {
      throw new Error(toMessage(label), { cause: result.error })
    }
    return valid
  }

  return result.success
    ? { success: true, data: valid }
    : { success: false, error: reportOnce(label, result.error) }
}
