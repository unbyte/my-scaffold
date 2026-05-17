import type { Actions, NodePlopAPI } from 'plop'
import { pnpmInstall } from '#actions/install'
import { addPackage } from './actions'
import { type PromptPackageAnswer, promptPackage } from './prompts'

export default function (plop: NodePlopAPI) {
  const output = plop.getDestBasePath()

  plop.setGenerator('mono/pkg', {
    description: 'Add a new package to the monorepo',
    prompts: promptPackage,
    actions: (_answer) => {
      const answer = _answer as PromptPackageAnswer

      const actions: Actions = []
      actions.push(addPackage(output, answer))
      actions.push(pnpmInstall(output))

      return actions
    },
  })
}
