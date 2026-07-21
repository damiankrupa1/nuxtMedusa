module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'js', 'vue'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
    '^.+\\.vue$': '@vue/vue3-jest',
  },
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/app/$1',
    '^#/(.*)$': '<rootDir>/$1',
  },
}
