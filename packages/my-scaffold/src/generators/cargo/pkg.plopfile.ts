import type { NodePlopAPI } from 'plop'
import { addCargoPackage, cargoLockfile, checkCargoWorkspace } from './actions'
import { type PromptCargoPackageAnswer, promptCargoPackage } from './prompts'

export default function (plop: NodePlopAPI) {
  const output = plop.getDestBasePath()

  plop.setGenerator('cargo/pkg', {
    description: 'Add a new crate to the Cargo workspace',
    prompts: (inquirer) => promptCargoPackage(inquirer),
    actions: (_answer) => {
      const answer = _answer as PromptCargoPackageAnswer
      return [checkCargoWorkspace(output, answer), addCargoPackage(output, answer), cargoLockfile(output)]
    },
  })
}
