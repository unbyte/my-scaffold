import { gitInit, pnpmInstall } from '../../actions/commands'
import { checkNewPath } from '../../actions/files'
import { renderTemplate } from '../../actions/template'
import { Template } from '../../templates'
import { defineGenerator } from '../definition'
import { addPackage } from './files'
import { promptMonorepoInit } from './prompts'
import { monorepoSchema, normalizePackage } from './schema'

export const monoInit = defineGenerator({
  description: 'Generate a new monorepo',
  schema: monorepoSchema,
  prompt: promptMonorepoInit,
  async generate(input, context) {
    const packages = input.packages.map(normalizePackage)
    for (const pkg of packages) await checkNewPath(context.target, `packages/${pkg.directory}`)
    await renderTemplate(context.target, Template.MonorepoLayout)
    for (const pkg of packages) await addPackage(context.target, pkg)
    if (context.git) await gitInit(context.target)
    if (context.install) await pnpmInstall(context.target)
  },
})
