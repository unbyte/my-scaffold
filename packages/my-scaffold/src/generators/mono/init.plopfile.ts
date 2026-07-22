import type { Actions, NodePlopAPI } from 'plop'
import { renameDotfiles } from '#actions/dotfiles'
import { gitInit, pnpmInstall } from '#actions/install'
import { addTemplate } from '#actions/template'
import { Template } from '#templates'
import { addPackage, resolveDefaultBranch } from './actions'
import { type PromptMonorepoInitAnswer, promptMonorepoInit } from './prompts'

export default function (plop: NodePlopAPI) {
  const output = plop.getDestBasePath()

  plop.setGenerator('mono/init', {
    description: 'Generate a new monorepo',
    prompts: promptMonorepoInit,
    actions: (_answer) => {
      const answer = _answer as PromptMonorepoInitAnswer

      const actions: Actions = []

      actions.push(
        addTemplate(output, Template.MonorepoLayout, {
          main: answer.main,
          releaseAll: answer.releaseStyle === 'all',
          baseBranch: resolveDefaultBranch(),
        }),
      )
      actions.push(renameDotfiles(output))

      for (const pkg of answer.packages) {
        actions.push(addPackage(output, pkg))
      }

      actions.push(gitInit(output))
      actions.push(pnpmInstall(output))

      return actions
    },
  })
}
