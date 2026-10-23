import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['electron/**/*.ts', 'shared/**/*.ts', 'src/**/*.ts'],
      exclude: ['electron/main.ts', 'electron/preload.ts', 'src/main.ts', '**/*.d.ts'],
    },
  },
})
