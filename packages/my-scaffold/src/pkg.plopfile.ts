import type { Actions, NodePlopAPI } from 'plop'
import { addPackage, pnpmInstall } from './actions'
import { type PromptPackageAnswer, promptPackage } from './prompts'

export default function (plop: NodePlopAPI) {
  const output = plop.getDestBasePath()

  plop.setGenerator('package', {
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
