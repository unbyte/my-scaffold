import { pnpmInstall } from '../../actions/commands'
import { renderTemplate } from '../../actions/template'
import { Template } from '../../templates'
import { defineGenerator } from '../definition'
import { checkSetup, configureProject } from './files'
import { resolveBaseBranch } from './git'
import { promptLocal } from './prompts'
import { localSchema } from './schema'

export const changesetLocal = defineGenerator({
  description: 'Set up local Changesets releases',
  schema: localSchema,
  prompt: promptLocal,
  async generate(input, context) {
    await checkSetup(context.target)
    const baseBranch = await resolveBaseBranch(context.target, input.baseBranch)
    await renderTemplate(context.target, Template.ChangesetLocal, {
      baseBranchJson: JSON.stringify(baseBranch),
    })
    await configureProject(context.target, 'local')
    if (context.install) await pnpmInstall(context.target)
  },
})
