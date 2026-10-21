import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'lib',
  format: ['cjs'],
  platform: 'node',
  target: 'node18',
  dts: false,
  clean: true,
  minify: false,
  treeshake: true,
  sourcemap: false,
})
