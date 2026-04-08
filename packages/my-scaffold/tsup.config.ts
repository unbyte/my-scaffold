import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/init.plopfile.ts', 'src/pkg.plopfile.ts'],
  outDir: 'lib',
  format: ['cjs'],
  platform: 'node',
  dts: false,
  clean: true,
  minify: false,
  treeshake: true,
  sourcemap: false,
})
