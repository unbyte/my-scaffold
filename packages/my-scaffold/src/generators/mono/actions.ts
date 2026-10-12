import { join } from 'node:path'
import execa from 'execa'
import type { ActionType } from 'plop'
import { modifyJson } from '#actions/json'
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
  const templateBase = resolveTemplate(pkg.template)

  return {
    type: 'addMany',
    destination: join(path, 'packages', pkg.directory),
    base: templateBase,
    templateFiles: `${templateBase}/**/*`,
    data: {
      pkgName: pkg.name,
      binName: pkg.bin,
    },
  }
}

export function addPackageReference(path: string, pkg: PromptPackageAnswer) {
  return modifyJson<{ references?: { path: string }[] }>(join(path, 'tsconfig.json'), (config) => {
    const referencePath = `./packages/${pkg.directory}`
    config.references ??= []
    if (!config.references.some((reference) => reference.path === referencePath)) {
      config.references.push({ path: referencePath })
    }
    return config
  })
}
