// @ts-check
import prettierConfig from 'eslint-config-prettier'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  prettierConfig,
  {
    // A promise that is neither awaited nor handled (typically an async
    // callback passed to forEach) fails silently, so it needs type information.
    files: ['app/**/*.ts', 'server/**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
    },
  },
  {
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
            {
              group: ['@jest/*'],
              message: 'Import test APIs from vitest; Jest is no longer used.',
            },
          ],
        },
      ],
      'no-await-in-loop': 'warn',
      'no-restricted-syntax': [
        'warn',
        {
          selector: 'ForOfStatement',
          message:
            'Use array methods (forEach, map, filter, some, every, find, reduce) instead of for...of. For an object, iterate Object.entries(obj).forEach(([key, value]) => ...).',
        },
      ],
    },
  },
)
