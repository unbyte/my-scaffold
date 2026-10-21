import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import execa from 'execa'
import { checkDirectory, pathStats } from '../../files'
import { modifyJson, readJson } from '../../json'
import { renderTemplate } from '../../template'
import type { normalizePackage } from './schema'

type Package = ReturnType<typeof normalizePackage>

export function resolveDefaultBranch() {
  try {
    const { stdout } = execa.sync('git', ['config', '--get', 'init.defaultBranch'], { stdin: 'ignore' })
    return stdout.trim() || 'master'
  } catch {
    return 'master'
  }
}

export async function checkMonorepo(path: string, pkg: Package) {
  await checkDirectory(path)
  await readJson(join(path, 'package.json'))
  if (!(await pathStats(join(path, 'pnpm-workspace.yaml')))?.isFile()) {
    throw new Error('Run mono/pkg with the pnpm workspace root as the target directory')
  }
  const config = await readJson<{ references?: unknown }>(join(path, 'tsconfig.json'))
  if (
    config.references !== undefined &&
    (!Array.isArray(config.references) ||
      config.references.some((reference) => !reference || typeof reference.path !== 'string'))
  )
    throw new Error('Expected tsconfig.json references to be an array of project paths')

  const packages = join(path, 'packages')
  await checkDirectory(packages)
  if (!(await pathStats(packages))) return
  for (const entry of await readdir(packages, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const manifest = join(packages, entry.name, 'package.json')
    if (!(await pathStats(manifest))) continue
    const existing = await readJson<{ name?: string }>(manifest)
    if (existing.name === pkg.name) throw new Error(`Package ${pkg.name} already exists in the workspace`)
  }
}

export async function addPackage(path: string, pkg: Package) {
  await renderTemplate(join(path, 'packages', pkg.directory), pkg.template, { pkgName: pkg.name, binName: pkg.bin })
  await modifyJson<{ references?: { path: string }[] }>(join(path, 'tsconfig.json'), (config) => {
    const referencePath = `./packages/${pkg.directory}`
    config.references ??= []
    if (!config.references.some((reference) => reference.path === referencePath)) {
      config.references.push({ path: referencePath })
    }
    return config
  })
}
