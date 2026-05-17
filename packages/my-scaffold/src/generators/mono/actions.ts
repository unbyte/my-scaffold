import { join } from 'node:path'
import type { ActionType } from 'plop'
import { resolveTemplate } from '#templates'
import type { PromptPackageAnswer } from './prompts'

export function addPackage(path: string, pkg: PromptPackageAnswer): ActionType {
  const dirname = pkg.name.split('/').pop()!
  const templateBase = resolveTemplate(pkg.template)

  return {
    type: 'addMany',
    destination: join(path, 'packages', dirname),
    base: templateBase,
    templateFiles: `${templateBase}/**/*`,
    data: {
      pkgName: pkg.name,
      binName: pkg.bin,
    },
  }
}
