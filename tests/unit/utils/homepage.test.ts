import { describe, expect, it } from 'vitest'
import { sections } from '~/utils/homepage'

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
