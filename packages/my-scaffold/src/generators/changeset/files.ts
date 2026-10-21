import { join } from 'node:path'
import { z } from 'zod'
import { checkDirectory, checkNewPath, pathStats } from '../../actions/files'
import { modifyJson, readJson } from '../../actions/json'

const manifestSchema = z.looseObject({
  packageManager: z.string().optional(),
  scripts: z.record(z.string(), z.string()).optional(),
  dependencies: z.record(z.string(), z.string()).optional(),
  devDependencies: z.record(z.string(), z.string()).optional(),
})

export async function readProject(target: string) {
  await checkDirectory(target)
  if (!(await pathStats(join(target, 'pnpm-workspace.yaml')))?.isFile()) {
    throw new Error('Run changeset generators with the pnpm workspace root created by mono/init as the target')
  }
  return manifestSchema.parse(await readJson(join(target, 'package.json')))
}

export async function checkSetup(target: string) {
  const pkg = await readProject(target)
  await checkNewPath(target, '.changeset')
  return pkg
}

export function pinnedPnpmVersion(packageManager: string | undefined) {
  if (packageManager === undefined) return undefined
  const match = /^pnpm@(\d+\.\d+\.\d+)(?:\+sha\d+\.[a-fA-F0-9]+)?$/.exec(packageManager)
  if (!match) throw new Error('Expected package.json packageManager to pin an exact pnpm version')
  return match[1]
}

export async function configureProject(target: string, mode: 'local' | 'ci', pnpmVersion?: string) {
  await modifyJson<z.infer<typeof manifestSchema>>(join(target, 'package.json'), (pkg) => {
    pkg.devDependencies ??= {}
    const dependencies = pkg.dependencies?.['@changesets/cli'] ? pkg.dependencies : pkg.devDependencies
    if (mode === 'ci' || !dependencies['@changesets/cli']) dependencies['@changesets/cli'] = '^3.0.3'
    if (mode === 'ci' && !pkg.dependencies?.['@changesets/changelog-github']) {
      pkg.devDependencies['@changesets/changelog-github'] ??= '^1.0.1'
    }
    if (pnpmVersion !== undefined) pkg.packageManager ??= `pnpm@${pnpmVersion}`
    return pkg
  })
}
