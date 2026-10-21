import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { gitInit, pnpmInstall, runCommand } from '../../commands'
import { checkEmptyDirectory } from '../../files'
import { defineGenerator } from '../../generator'
import { mergeJson } from '../../json'
import { renderTemplate } from '../../template'
import { resolveTemplate, Template } from '../../templates'
import { promptViteInit } from './prompts'
import { viteSchema } from './schema'

export const viteInit = defineGenerator({
  description: 'Generate a new Vite project',
  schema: viteSchema,
  prompt: promptViteInit,
  async generate(input, context) {
    await checkEmptyDirectory(context.target)
    await mkdir(context.target, { recursive: true })
    await runCommand(context.target, 'pnpm', [
      'create',
      'vite',
      '.',
      '--template',
      input.template,
      '--no-interactive',
      '--no-immediate',
    ])
    await renderTemplate(context.target, Template.ViteLayout, {}, ['package.json'])
    await mergeJson(join(context.target, 'package.json'), join(resolveTemplate(Template.ViteLayout), 'package.json'))
    if (context.git) await gitInit(context.target)
    if (context.install) await pnpmInstall(context.target)
  },
})
