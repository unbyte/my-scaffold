import { gitInit } from '../../actions/commands'
import { checkNewPath } from '../../actions/files'
import { renderTemplate } from '../../actions/template'
import { Template } from '../../templates'
import { defineGenerator } from '../definition'
import { addCrate, cargoLockfile, resolveRustVersion } from './files'
import { promptCargoInit } from './prompts'
import { cargoWorkspaceSchema, normalizeCrate } from './schema'

export const cargoInit = defineGenerator({
  description: 'Generate a new Cargo workspace',
  schema: cargoWorkspaceSchema,
  prompt: promptCargoInit,
  async generate(input, context) {
    const packages = input.packages.map(normalizeCrate)
    for (const pkg of packages) await checkNewPath(context.target, `crates/${pkg.directory}`)
    const rustVersion = resolveRustVersion()
    await renderTemplate(context.target, Template.CargoLayout, { rustVersion })
    for (const pkg of packages) await addCrate(context.target, pkg)
    await cargoLockfile(context.target)
    if (context.git) await gitInit(context.target)
  },
})
