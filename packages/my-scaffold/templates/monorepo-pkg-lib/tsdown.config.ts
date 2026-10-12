import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'lib',
  format: ['esm', 'cjs'],
  platform: 'node',
  dts: true,
  clean: true,
  minify: false,
  treeshake: true,
  sourcemap: false,
})
