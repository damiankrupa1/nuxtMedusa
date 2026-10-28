import { beforeEach, describe, expect, it } from '@jest/globals'

import { resetReportedOnce, shouldReportOnce } from '~/utils/report-once'

describe('shouldReportOnce', () => {
  beforeEach(() => {
    resetReportedOnce()
  })

  it('allows a key the first time and refuses every repeat', () => {
    expect(shouldReportOnce('payload:navigation:primaryNav:invalid_type')).toBe(
      true,
    )
    expect(shouldReportOnce('payload:navigation:primaryNav:invalid_type')).toBe(
      false,
    )
    expect(shouldReportOnce('payload:navigation:primaryNav:invalid_type')).toBe(
      false,
    )
  })

  it('treats different keys independently', () => {
    expect(shouldReportOnce('a')).toBe(true)
    expect(shouldReportOnce('b')).toBe(true)
  })

  it('forgets everything on reset', () => {
    shouldReportOnce('a')
    resetReportedOnce()

    expect(shouldReportOnce('a')).toBe(true)
  })
})
