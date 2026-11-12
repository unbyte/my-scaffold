import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'lib',
  format: [{{#each format}}'{{this}}'{{#unless @last}}, {{/unless}}{{/each}}],
  platform: 'node',
  dts: false,
  clean: true,
  minify: false,
  treeshake: true,
  sourcemap: false,
})
