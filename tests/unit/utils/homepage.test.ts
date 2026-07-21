import { describe, expect, it } from '@jest/globals'
import { sections } from '../../../app/utils/homepage'

describe('homepage utils', () => {
  it('defines the expected featured products section', () => {
    expect(sections).toEqual([
      {
        sections: [
          {
            type: 'products',
            title: 'Polecane',
            category: 'pants',
            limit: 8,
          },
        ],
      },
    ])
  })
})
