import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'lib',
  format: [{{#each format}}'{{this}}'{{#unless @last}}, {{/unless}}{{/each}}],
  platform: '{{ platform }}',
  dts: true,
  clean: true,
  minify: false,
  treeshake: true,
  sourcemap: false,
})
