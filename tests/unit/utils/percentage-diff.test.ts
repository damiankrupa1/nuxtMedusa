import { describe, expect, it } from '@jest/globals'

import { getPercentageDiff } from '../../../app/utils/percentage-diff'

describe('percentage diff utils', () => {
  it('returns undefined when inputs are missing', () => {
    expect(getPercentageDiff(undefined, 10)).toBeUndefined()
    expect(getPercentageDiff(10, undefined)).toBeUndefined()
    expect(getPercentageDiff(0, 10)).toBeUndefined()
  })

  it('calculates the percentage difference', () => {
    expect(getPercentageDiff(100, 80)).toBe('20')
    expect(getPercentageDiff(80, 100)).toBe('-25')
  })
})
