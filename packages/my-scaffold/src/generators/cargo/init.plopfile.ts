import type { Actions, NodePlopAPI } from 'plop'
import { renameDotfiles } from '#actions/dotfiles'
import { gitInit } from '#actions/install'
import { addTemplate } from '#actions/template'
import { Template } from '#templates'
import { addCargoPackage, cargoLockfile, resolveRustVersion } from './actions'
import { type PromptCargoInitAnswer, promptCargoInit } from './prompts'

export default function (plop: NodePlopAPI) {
  const output = plop.getDestBasePath()

  plop.setGenerator('cargo/init', {
    description: 'Generate a new Cargo workspace',
    prompts: promptCargoInit,
    actions: (_answer) => {
      const answer = _answer as PromptCargoInitAnswer
      const actions: Actions = [
        addTemplate(output, Template.CargoLayout, { rustVersion: resolveRustVersion() }),
        renameDotfiles(output),
      ]

      for (const pkg of answer.packages) {
        actions.push(addCargoPackage(output, pkg))
      }

      actions.push(cargoLockfile(output), gitInit(output))
      return actions
    },
  })
}
