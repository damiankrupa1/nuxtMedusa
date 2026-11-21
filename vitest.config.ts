import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
import { defineVitestProject } from '@nuxt/test-utils/config'
import { defineConfig } from 'vitest/config'

process.env.NUXT_TEST_UTILS = 'true'

const appDirectory = fileURLToPath(new URL('./app/', import.meta.url))
const rootDirectory = fileURLToPath(new URL('./', import.meta.url))

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [vue()],
        resolve: {
          alias: [
            { find: /^~\//, replacement: appDirectory },
            { find: /^~~\//, replacement: rootDirectory },
          ],
        },
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.ts'],
          environment: 'jsdom',
          setupFiles: ['./tests/setup.ts'],
          typecheck: {
            enabled: true,
            checker: 'tsc',
            include: ['tests/unit/**/*.test.ts'],
            tsconfig: 'tsconfig.test-unit.json',
          },
        },
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['tests/nuxt/**/*.test.ts'],
          environment: 'nuxt',
          environmentOptions: {
            nuxt: {
              domEnvironment: 'jsdom',
            },
          },
        },
      }),
    ],
  },
})
