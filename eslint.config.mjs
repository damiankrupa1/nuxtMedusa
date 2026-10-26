// @ts-check
import prettierConfig from 'eslint-config-prettier'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(prettierConfig, {
  files: ['app/**/*.{ts,vue}', 'server/**/*.ts', 'tests/**/*.ts'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['./*', '../*', '.', '..'],
            message:
              "Use a root alias instead of a relative path: '~/' for app/ (also from tests/), '~~/' for the project root (e.g. '~~/server/...').",
          },
        ],
      },
    ],
  },
})
