/**
 * Reports an error the team should look into. Errors are reported once, where
 * they come from an external system, so error monitoring only needs plugging
 * in here. Until then they go to the console.
 */
export function captureError(
  error: unknown,
  context: Record<string, unknown> = {},
) {
  console.error(error, context)
}
