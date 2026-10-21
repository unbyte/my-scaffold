import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { gitInit, pnpmInstall, runCommand } from '../../actions/commands'
import { checkEmptyDirectory } from '../../actions/files'
import { mergeJson } from '../../actions/json'
import { renderTemplate } from '../../actions/template'
import { resolveTemplate, Template } from '../../templates'
import { defineGenerator } from '../definition'
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
