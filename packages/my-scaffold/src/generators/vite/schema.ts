import { z } from 'zod'

export const viteTemplate = z.enum([
  'vanilla',
  'vanilla-ts',
  'vue',
  'vue-ts',
  'react',
  'react-ts',
  'react-compiler',
  'react-compiler-ts',
  'preact',
  'preact-ts',
  'lit',
  'lit-ts',
  'svelte',
  'svelte-ts',
  'solid',
  'solid-ts',
  'qwik',
  'qwik-ts',
])

export const viteSchema = z
  .strictObject({
    template: viteTemplate.describe('create-vite template to generate'),
  })
  .meta({ examples: [{ template: 'react-ts' }] })

export const wranglerSchema = z.strictObject({}).meta({ examples: [{}] })
