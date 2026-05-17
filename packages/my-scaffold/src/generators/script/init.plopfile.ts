import type { Actions, NodePlopAPI } from 'plop'
import { renameDotfiles } from '#actions/dotfiles'
import { gitInit, pnpmInstall } from '#actions/install'
import { addTemplate } from '#actions/template'
import { Template } from '#templates'
import { promptScriptInit } from './prompts'

export default function (plop: NodePlopAPI) {
  const output = plop.getDestBasePath()

  plop.setGenerator('script/init', {
    description: 'Generate a new script project',
    prompts: promptScriptInit,
    actions: () => {
      const actions: Actions = []

      actions.push(addTemplate(output, Template.ScriptLayout))
      actions.push(renameDotfiles(output))
      actions.push(gitInit(output))
      actions.push(pnpmInstall(output))

      return actions
    },
  })
}
