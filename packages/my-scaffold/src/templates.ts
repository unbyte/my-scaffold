import { join } from 'node:path'

export enum Template {
  CargoLayout = 'cargo-layout',
  CargoPkg = 'cargo-pkg',
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
  return join(__dirname, '..', 'templates', template)
}
