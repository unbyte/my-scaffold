import { pnpmInstall } from '../../actions/commands'
import { checkNewPath } from '../../actions/files'
import { defineGenerator } from '../definition'
import { addPackage, checkMonorepo } from './files'
import { promptPackage } from './prompts'
import { normalizePackage, packageSchema } from './schema'

export const monoPackage = defineGenerator({
  description: 'Add a new package to a monorepo',
  schema: packageSchema,
  prompt: promptPackage,
  async generate(input, context) {
    const pkg = normalizePackage(input)
    await checkMonorepo(context.target, pkg)
    await checkNewPath(context.target, `packages/${pkg.directory}`)
    await addPackage(context.target, pkg)
    if (context.install) await pnpmInstall(context.target)
  },
})
