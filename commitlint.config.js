export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'refactor', 'docs', 'style', 'test', 'build'],
    ],
    'subject-empty': [2, 'never'],
    'subject-max-length': [2, 'always', 72],
  },
}
