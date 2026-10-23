import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron/simple'

export default defineConfig({
  base: './',
  server: {
    host: '127.0.0.1',
    watch: {
      ignored: ['**/dist-electron/**', '**/release/**', '**/coverage/**'],
    },
  },
  plugins: [
    electron({
      main: {
        entry: 'electron/main.ts',
      },
      preload: {
        input: 'electron/preload.ts',
        vite: {
          build: {
            rolldownOptions: {
              output: {
                entryFileNames: '[name].cjs',
                chunkFileNames: '[name].cjs',
              },
            },
          },
        },
      },
    }),
  ],
})
