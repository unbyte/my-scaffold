import { pnpmInstall } from '../../commands'
import { checkNewPath } from '../../files'
import { defineGenerator } from '../../generator'
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
