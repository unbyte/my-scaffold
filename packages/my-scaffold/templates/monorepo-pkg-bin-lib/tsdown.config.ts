import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/bin.ts'],
  outDir: 'lib',
  format: [{{#each format}}'{{this}}'{{#unless @last}}, {{/unless}}{{/each}}],
  platform: 'node',
  dts: { entry: 'src/index.ts' },
  clean: true,
  minify: false,
  treeshake: true,
  sourcemap: false,
})
