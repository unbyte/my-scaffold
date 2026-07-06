import { dirname, join } from 'node:path'
import { name } from '../package.json'

export enum Template {
  MonorepoLayout = 'monorepo-layout',
  MonorepoPkgBin = 'monorepo-pkg-bin',
  MonorepoPkgBinLib = 'monorepo-pkg-bin-lib',
  MonorepoPkgLib = 'monorepo-pkg-lib',
  MonorepoPkgPrivate = 'monorepo-pkg-private',
  ScriptLayout = 'script-layout',
  ViteLayout = 'vite-layout',
  ViteWrangler = 'vite-wrangler',
}

export function resolveTemplate(template: Template) {
  const packageRoot = dirname(require.resolve(`${name}/package.json`))
  return join(packageRoot, 'templates', template)
}
