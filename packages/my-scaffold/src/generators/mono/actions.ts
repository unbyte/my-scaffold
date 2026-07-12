import { join } from 'node:path'
import execa from 'execa'
import type { ActionType } from 'plop'
import { resolveTemplate } from '#templates'
import type { PromptPackageAnswer } from './prompts'

export function resolveDefaultBranch() {
  try {
    const { stdout } = execa.sync('git', ['config', '--get', 'init.defaultBranch'])
    return stdout.trim() || 'master'
  } catch {
    return 'master'
  }
}

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
