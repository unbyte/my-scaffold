import { gitInit, pnpmInstall } from '../../actions/commands'
import { checkEmptyDirectory } from '../../actions/files'
import { renderTemplate } from '../../actions/template'
import { Template } from '../../templates'
import { defineGenerator } from '../definition'
import { promptElectronInit } from './prompts'
import { electronSchema } from './schema'

export const electronInit = defineGenerator({
  description: 'Generate an Electron app with Vanilla TypeScript, Vite, Vitest, and electron-builder',
  schema: electronSchema,
  prompt: promptElectronInit,
  async generate(input, context) {
    await checkEmptyDirectory(context.target)
    await renderTemplate(context.target, Template.ElectronLayout, input)
    if (context.git) await gitInit(context.target)
    if (context.install) await pnpmInstall(context.target)
  },
})
