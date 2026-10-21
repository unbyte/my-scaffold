import { checkNewPath } from '../../actions/files'
import { defineGenerator } from '../definition'
import { addCrate, cargoLockfile, checkCargoWorkspace } from './files'
import { promptCargoPackage } from './prompts'
import { crateSchema, normalizeCrate } from './schema'

export const cargoPackage = defineGenerator({
  description: 'Add a new crate to a Cargo workspace',
  schema: crateSchema,
  prompt: promptCargoPackage,
  async generate(input, context) {
    const pkg = normalizeCrate(input)
    await checkNewPath(context.target, `crates/${pkg.directory}`)
    await checkCargoWorkspace(context.target, pkg)
    await addCrate(context.target, pkg)
    await cargoLockfile(context.target)
  },
})
