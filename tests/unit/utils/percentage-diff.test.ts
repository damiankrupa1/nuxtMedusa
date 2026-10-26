import { describe, expect, it } from '@jest/globals'

import { getPercentageDiff } from '~/utils/percentage-diff'

describe('percentage diff utils', () => {
  it('returns null when inputs are missing or the original price is zero', () => {
    expect(getPercentageDiff(undefined, 10)).toBeNull()
    expect(getPercentageDiff(10, undefined)).toBeNull()
    expect(getPercentageDiff(null, 10)).toBeNull()
    expect(getPercentageDiff(10, null)).toBeNull()
    expect(getPercentageDiff(0, 10)).toBeNull()
  })

  it('calculates the percentage difference', () => {
    expect(getPercentageDiff(100, 80)).toBe('20')
    expect(getPercentageDiff(80, 100)).toBe('-25')
    expect(getPercentageDiff(100, 0)).toBe('100')
  })
})
