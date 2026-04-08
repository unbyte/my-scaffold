import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'lib',
  format: ['cjs'],
  platform: 'node',
  dts: true,
  clean: true,
  minify: false,
  treeshake: true,
  sourcemap: false,
})
