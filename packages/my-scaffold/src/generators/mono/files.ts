import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { checkDirectory, pathStats } from '../../actions/files'
import { modifyJson, readJson } from '../../actions/json'
import { renderTemplate } from '../../actions/template'
import { Template } from '../../templates'
import type { normalizePackage } from './schema'

type Package = ReturnType<typeof normalizePackage>

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

  for (const existing of await listPackages(path)) {
    if (existing.manifest.name === pkg.name) throw new Error(`Package ${pkg.name} already exists in the workspace`)
  }
}

export async function listPackages(path: string) {
  const packages = join(path, 'packages')
  await checkDirectory(packages)
  if (!(await pathStats(packages))) return []
  const result = []
  const entries = await readdir(packages, { withFileTypes: true })
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory()) continue
    const path = join(packages, entry.name, 'package.json')
    if (!(await pathStats(path))) continue
    const manifest = await readJson<{ name?: string; private?: boolean }>(path)
    result.push({ path, directory: `packages/${entry.name}`, manifest })
  }
  return result
}

export async function addPackage(path: string, pkg: Package) {
  const data: Record<string, unknown> = { pkgName: pkg.name }
  if (pkg.access === 'public') {
    Object.assign(data, {
      binName: pkg.bin,
      format: pkg.format,
      esm: pkg.format.includes('esm'),
      cjs: pkg.format.includes('cjs'),
    })
    if (pkg.template === Template.MonorepoPkgLib) {
      Object.assign(data, {
        platform: pkg.platform,
        node: pkg.platform === 'node',
        browser: pkg.platform === 'browser',
        esmExtension: pkg.platform === 'node' ? 'mjs' : 'js',
        esmDeclarationExtension: pkg.platform === 'node' ? 'mts' : 'ts',
      })
    }
  }
  await renderTemplate(join(path, 'packages', pkg.directory), pkg.template, data)
  await modifyJson<{ references?: { path: string }[] }>(join(path, 'tsconfig.json'), (config) => {
    const referencePath = `./packages/${pkg.directory}`
    config.references ??= []
    if (!config.references.some((reference) => reference.path === referencePath)) {
      config.references.push({ path: referencePath })
    }
    return config
  })
}
