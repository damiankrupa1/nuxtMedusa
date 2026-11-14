import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const appDirectory = fileURLToPath(new URL('./app/', import.meta.url))
const rootDirectory = fileURLToPath(new URL('./', import.meta.url))

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      { find: /^~\//, replacement: appDirectory },
      { find: /^~~\//, replacement: rootDirectory },
    ],
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    typecheck: {
      enabled: true,
      checker: 'tsc',
      include: ['tests/unit/**/*.test.ts'],
      tsconfig: 'tsconfig.json',
    },
  },
})
