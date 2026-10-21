import { gitInit, pnpmInstall } from '../../commands'
import { checkNewPath } from '../../files'
import { defineGenerator } from '../../generator'
import { renderTemplate } from '../../template'
import { Template } from '../../templates'
import { addPackage, resolveDefaultBranch } from './files'
import { promptMonorepoInit } from './prompts'
import { monorepoSchema, normalizeMonorepo } from './schema'

export const monoInit = defineGenerator({
  description: 'Generate a new monorepo',
  schema: monorepoSchema,
  prompt: promptMonorepoInit,
  async generate(input, context) {
    const config = normalizeMonorepo(input)
    for (const pkg of config.packages) await checkNewPath(context.target, `packages/${pkg.directory}`)
    const baseBranch = resolveDefaultBranch()
    await renderTemplate(context.target, Template.MonorepoLayout, {
      main: config.main,
      releaseAll: config.releaseStyle === 'all',
      baseBranch,
    })
    for (const pkg of config.packages) await addPackage(context.target, pkg)
    if (context.git) await gitInit(context.target)
    if (context.install) await pnpmInstall(context.target)
  },
})
